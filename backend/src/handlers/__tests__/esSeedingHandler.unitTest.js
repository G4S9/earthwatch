const MOCK_AWS_REGION = 'ANY_AWS_REGION';
const MOCK_SIGNED_REQUEST_BODY = 'ANY_SIGNED_REQUEST_BODY';
const MOCK_SIGNED_REQUEST_HEADERS = 'ANY_SIGNED_REQUEST_HEADERS';
const MOCK_SIGNED_REQUEST = {
  body: MOCK_SIGNED_REQUEST_BODY,
  headers: MOCK_SIGNED_REQUEST_HEADERS,
};
const MOCK_AXIOS_PUT_RESULT_DATA = 'ANY_AXIOS_PUT_RESULT_DATA';
const MOCK_AXIOS_PUT_RESULT = { data: MOCK_AXIOS_PUT_RESULT_DATA };
const MOCK_STACK_ID = 'ANY_STACK_ID';
const MOCK_RESPONSE_URL = 'ANY_RESPONSE_URL';
const MOCK_REQUEST_ID = 'ANY_REQUEST_ID';
const MOCK_LOGICAL_RESOURCE_ID = 'ANY_LOGICAL_RESOURCE_ID';
const MOCK_INDEX_NAME = 'ANY_INDEX_NAME';
const MOCK_ES_SEARCH_DOMAIN_ENDPOINT = 'ANY_ES_SEARCH_DOMAIN_ENDPOINT';
const MOCK_EVENT = {
  RequestType: 'Create',
  StackId: MOCK_STACK_ID,
  ResponseURL: MOCK_RESPONSE_URL,
  RequestId: MOCK_REQUEST_ID,
  LogicalResourceId: MOCK_LOGICAL_RESOURCE_ID,
  ResourceProperties: {
    indexName: MOCK_INDEX_NAME,
    esSearchDomainEndpoint: MOCK_ES_SEARCH_DOMAIN_ENDPOINT,
  },
};
const MOCK_LOG_STREAM_NAME = 'ANY_LOG_STREAM_NAME';
const MOCK_CONTEXT = {
  logStreamName: MOCK_LOG_STREAM_NAME,
};
const MOCK_ERROR = new Error('ANY_ERROR');

jest.mock('axios', () => ({
  put: jest.fn(),
}));
jest.mock('../esSeedingHandlerConfig', () => ({
  AWS_REGION: MOCK_AWS_REGION,
}));
jest.mock('../../lib/getSignedRequest', () => ({
  getSignedRequest: jest.fn(),
}));

const axios = require('axios');
const { getSignedRequest } = require('../../lib/getSignedRequest');

const { handler } = require('../esSeedingHandler');

describe('', () => {
  let mockLog;
  let mockError;
  beforeAll(() => {
    mockLog = jest.spyOn(console, 'log').mockImplementation();
    mockError = jest.spyOn(console, 'error').mockImplementation();
  });
  afterAll(() => {
    mockLog.mockRestore();
    mockError.mockRestore();
  });
  beforeEach(() => {
    axios.put.mockResolvedValue(MOCK_AXIOS_PUT_RESULT);
    getSignedRequest.mockReturnValue(MOCK_SIGNED_REQUEST);
  });
  it('handles create events properly', async () => {
    await expect(handler(MOCK_EVENT, MOCK_CONTEXT))
      .resolves.toEqual();
    expect(getSignedRequest).toHaveBeenCalledTimes(1);
    expect(getSignedRequest).toHaveBeenCalledWith(
      `https://${MOCK_ES_SEARCH_DOMAIN_ENDPOINT}/${MOCK_INDEX_NAME}`,
      'PUT',
      {
        mappings:
          {
            properties: {
              coordinates: { type: 'geo_point' },
              id: { type: 'keyword' },
              mag: { type: 'double' },
              time: { format: 'epoch_millis', type: 'date' },
              title: { type: 'text' },
            },
          },
      },
      MOCK_AWS_REGION,
      'es',
    );
    expect(axios.put).toHaveBeenCalledTimes(2);
    expect(axios.put).toHaveBeenNthCalledWith(
      1,
      `https://${MOCK_ES_SEARCH_DOMAIN_ENDPOINT}/${MOCK_INDEX_NAME}`,
      MOCK_SIGNED_REQUEST_BODY,
      { headers: MOCK_SIGNED_REQUEST_HEADERS },
    );
    expect(axios.put).toHaveBeenNthCalledWith(
      2,
      MOCK_RESPONSE_URL,
      {
        Data: {},
        LogicalResourceId: MOCK_LOGICAL_RESOURCE_ID,
        PhysicalResourceId: MOCK_LOG_STREAM_NAME,
        Reason: expect.any(String),
        RequestId: MOCK_REQUEST_ID,
        StackId: MOCK_STACK_ID,
        Status: 'SUCCESS',
      },
    );
  });
  it('ignores other events', async () => {
    await expect(handler({
      ...MOCK_EVENT,
      RequestType: 'SOMETHING_ELSE_THAN_Create',
    }, MOCK_CONTEXT))
      .resolves.toEqual();
    expect(getSignedRequest).not.toHaveBeenCalled();
    expect(axios.put).toHaveBeenCalledTimes(1);
    expect(axios.put).toHaveBeenCalledWith(
      MOCK_RESPONSE_URL,
      {
        Data: {},
        LogicalResourceId: MOCK_LOGICAL_RESOURCE_ID,
        PhysicalResourceId: MOCK_LOG_STREAM_NAME,
        Reason: expect.any(String),
        RequestId: MOCK_REQUEST_ID,
        StackId: MOCK_STACK_ID,
        Status: 'SUCCESS',
      },
    );
  });
  it('handles errors properly', async () => {
    axios.put
      .mockImplementationOnce(() => Promise.reject(MOCK_ERROR))
      .mockResolvedValue();
    await expect(handler(MOCK_EVENT, MOCK_CONTEXT))
      .rejects.toEqual(MOCK_ERROR);
    expect(getSignedRequest).toHaveBeenCalledTimes(1);
    expect(getSignedRequest).toHaveBeenCalledWith(
      `https://${MOCK_ES_SEARCH_DOMAIN_ENDPOINT}/${MOCK_INDEX_NAME}`,
      'PUT',
      {
        mappings:
          {
            properties: {
              coordinates: { type: 'geo_point' },
              id: { type: 'keyword' },
              mag: { type: 'double' },
              time: { format: 'epoch_millis', type: 'date' },
              title: { type: 'text' },
            },
          },
      },
      MOCK_AWS_REGION,
      'es',
    );
    expect(axios.put).toHaveBeenCalledTimes(2);
    expect(axios.put).toHaveBeenNthCalledWith(
      1,
      `https://${MOCK_ES_SEARCH_DOMAIN_ENDPOINT}/${MOCK_INDEX_NAME}`,
      MOCK_SIGNED_REQUEST_BODY,
      { headers: MOCK_SIGNED_REQUEST_HEADERS },
    );
    expect(axios.put).toHaveBeenNthCalledWith(
      2,
      MOCK_RESPONSE_URL,
      {
        Data: {},
        LogicalResourceId: MOCK_LOGICAL_RESOURCE_ID,
        PhysicalResourceId: MOCK_LOG_STREAM_NAME,
        Reason: expect.any(String),
        RequestId: MOCK_REQUEST_ID,
        StackId: MOCK_STACK_ID,
        Status: 'FAILED',
      },
    );
  });
});
