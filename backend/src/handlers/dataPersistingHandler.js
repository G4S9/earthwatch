/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const axios = require('axios');
const gql = require('graphql-tag');
const { print } = require('graphql');
const { sqs } = require('../clients/sqs');
const { getSignedRequest } = require('../lib/getSignedRequest');
const { deleteMessageBatch } = require('../lib/sqs');
const {
  AWS_REGION,
  graphQLApiUrl,
  sqsQueueUrl,
  esSearchDomainEndpoint,
  indexName,
} = require('./dataPersistingHandlerConfig');

const esBaseUrl = `https://${esSearchDomainEndpoint}/${indexName}`;

const putQuake = gql`
mutation PutQuake($id: ID!, $time: Long!, $title: String!, $mag: Float!, $coordinates: PointInput!) {
  putQuake(id: $id, time: $time, title: $title, mag: $mag, coordinates: $coordinates) {
    id
    time
    title
    mag
    coordinates {
      lat
      lon
    }
  }
}
`;

const persistIntoElasticsearch = async (id, time, title, mag, coordinates) => {
  const url = `${esBaseUrl}/_doc/${id}`;
  const { body, headers } = getSignedRequest(url, 'PUT', {
    id, time, title, mag, coordinates,
  }, AWS_REGION, 'es');
  const { data } = await axios.put(url, body, { headers });
  console.log(JSON.stringify({ esResponse: data }));
};

const persistViaAppSync = async (id, time, title, mag, coordinates) => {
  const { body, headers } = getSignedRequest(graphQLApiUrl, 'POST', {
    query: print(putQuake),
    variables: {
      id, time, title, mag, coordinates,
    },
  }, AWS_REGION, 'appsync');
  const { data } = await axios.post(graphQLApiUrl, body, { headers });
  if (data.errors) {
    throw data.errors[0];
  }
  console.log(JSON.stringify({ appSyncResponse: data }));
};

module.exports.handler = async (event) => {
  try {
    // eslint-disable-next-line no-restricted-syntax
    for (const record of (event?.Records ?? [])) {
      console.log(JSON.stringify({ record }));
      const {
        id, time, title, mag, coordinates, seeding,
      } = JSON.parse(record.body);
      if (seeding) {
        await persistIntoElasticsearch(id, time, title, mag, coordinates);
      } else {
        await persistViaAppSync(id, time, title, mag, coordinates);
      }
    }
    if ((event?.Records ?? []).length) {
      await deleteMessageBatch(
        sqs,
        sqsQueueUrl,
        event.Records
          .map(({ messageId, receiptHandle }) => ({ Id: messageId, ReceiptHandle: receiptHandle })),
      );
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};
