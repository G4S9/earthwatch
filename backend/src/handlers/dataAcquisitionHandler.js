/* eslint-disable no-console */
const axios = require('axios');
const { ssm } = require('../clients/ssm');
const { sqs } = require('../clients/sqs');
const { getParameter, putParameter } = require('../lib/ssm');
const { sendMessageBatch } = require('../lib/sqs');
const {
  seedingDoneParamName,
  seedingDays,
  readBackMinutes,
  sqsQueueUrl,
} = require('./dataAcquisitionHandlerConfig');

const MAX_SQS_BATCH_SIZE = 10;

const getUsgsUrl = (startTime) => 'https://earthquake.usgs.gov/fdsnws/event/1/query'
  + '?format=geojson'
  + '&orderby=time-asc'
  + `&starttime=${startTime}`;

exports.handler = async () => {
  try {
    const seeding = await getParameter(ssm, seedingDoneParamName) !== 'true';

    console.log(JSON.stringify({ seeding }));

    const startTime = seeding
      ? `NOW-${seedingDays}days`
      : `NOW-${readBackMinutes}minutes`;

    console.log(JSON.stringify({ startTime }));

    const { data } = await axios.get(getUsgsUrl(startTime));
    const features = data?.features ?? [];

    console.log(JSON.stringify({ featuresLength: features.length }));

    const filteredFeatures = features
      .filter(
        (feature) => feature?.id
        && feature?.type === 'Feature'
        && feature?.geometry?.type === 'Point'
        && feature?.properties?.type === 'earthquake'
        && feature?.properties.time
        && feature?.properties.title
        && feature?.properties.mag,
      )
      .map(({
        id,
        properties: {
          time, title, mag,
        },
        geometry: { coordinates: [lon, lat] },
      }) => ({
        id,
        time,
        title,
        mag,
        coordinates: { lat, lon },
        seeding,
      }));

    console.log(JSON.stringify({ head: filteredFeatures[0] }));

    let entries = [];

    const sendEntries = async () => {
      console.log('sending batch');
      await sendMessageBatch(sqs, sqsQueueUrl, entries);
      console.log('sent batch');
      entries = [];
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const feature of filteredFeatures) {
      entries = [
        {
          Id: feature.id,
          MessageBody: JSON.stringify(feature),
        },
        ...entries,
      ];
      if (entries.length === MAX_SQS_BATCH_SIZE) {
        // eslint-disable-next-line no-await-in-loop
        await sendEntries();
      }
    }
    if (entries.length) {
      await sendEntries();
    }
    if (seeding) {
      console.log('updating parameter');
      await putParameter(ssm, seedingDoneParamName, 'true');
      console.log('updated parameter');
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};
