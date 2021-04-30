/* eslint-disable no-console */
const axios = require('axios');
const { AWS_REGION } = require('./esSeedingHandlerConfig');
const { getSignedRequest } = require('../lib/getSignedRequest');

const mappings = {
  properties: {
    id: { type: 'keyword' },
    time: { type: 'date', format: 'epoch_millis' },
    title: { type: 'text' },
    mag: { type: 'double' },
    coordinates: {
      type: 'geo_point',
    },
  },
};

exports.handler = async ({
  RequestType,
  StackId,
  ResponseURL,
  RequestId,
  LogicalResourceId,
  ResourceProperties: { indexName, esSearchDomainEndpoint },
}, { logStreamName }) => {
  try {
    const url = `https://${esSearchDomainEndpoint}/${indexName}`;
    if (RequestType === 'Create') {
      const { body, headers } = getSignedRequest(url, 'PUT', {
        mappings,
      }, AWS_REGION, 'es');
      const { data } = await axios.put(url, body, { headers });
      console.log(JSON.stringify({ data }));
    }
    await axios.put(ResponseURL, {
      Status: 'SUCCESS',
      Reason: `See the details in CloudWatch Log Stream: ${logStreamName}`,
      LogicalResourceId,
      PhysicalResourceId: logStreamName,
      StackId,
      RequestId,
      Data: {},
    });
  } catch (error) {
    console.error(error);
    await axios.put(ResponseURL, {
      Status: 'FAILED',
      Reason: `See the details in CloudWatch Log Stream: ${logStreamName}`,
      LogicalResourceId,
      PhysicalResourceId: logStreamName,
      StackId,
      RequestId,
      Data: {},
    });
    throw error;
  }
};
