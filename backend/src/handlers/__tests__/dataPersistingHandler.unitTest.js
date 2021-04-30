const MOCK_AWS_REGION = 'ANY_AWS_REGION';
const MOCK_GRAPHQL_API_URL = 'ANY_GRAPHQL_API_URL';
const MOCK_SQS_QUEUE_URL = 'ANY_SQS_QUEUE_URL';
const MOCK_ES_SEARCH_DOMAIN_ENDPOINT = 'ANY_ES_SEARCH_DOMAIN_ENDPOINT';
const MOCK_INDEX_NAME = 'ANY_INDEX_NAME';
const MOCK_ID = 'ANY_ID';
const MOCK_TIME = 'ANY_TIME';
const MOCK_TITLE = 'ANY_TITLE';
const MOCK_MAG = 'ANY_MAG';
const MOCK_LON = 'ANY_LON';
const MOCK_LAT = 'ANY_LAT';
const MOCK_RECORD = {
  id: MOCK_ID,
  time: MOCK_TIME,
  title: MOCK_TITLE,
  mag: MOCK_MAG,
  coordinates: [MOCK_LON, MOCK_LAT],
  seeding: true,
};
const MOCK_MESSAGE_ID = 'ANY_MESSAGE_ID';
const MOCK_RECEIPT_HANDLE = 'ANY_RECEIPT_HANDLE';
const RECORDS_COUNT = 5;
const MOCK_EVENT = {
  Records: [...new Array(RECORDS_COUNT)].map(() => ({
    messageId: MOCK_MESSAGE_ID,
    receiptHandle: MOCK_RECEIPT_HANDLE,
    body: JSON.stringify(MOCK_RECORD),
  })),
};
const MOCK_GQL_RESULT = 'ANY_GQL_RESULT';
const MOCK_PRINT_RESULT = 'MOCK_PRINT_RESULT';
const MOCK_SIGNED_REQUEST_BODY = 'ANY_SIGNED_REQUEST_BODY';
const MOCK_SIGNED_REQUEST_HEADERS = 'ANY_SIGNED_REQUEST_HEADERS';
const MOCK_SIGNED_REQUEST = {
  body: MOCK_SIGNED_REQUEST_BODY,
  headers: MOCK_SIGNED_REQUEST_HEADERS,
};
const MOCK_AXIOS_PUT_RESPONSE_DATA = 'ANY_AXIOS_PUT_RESPONSE_DATA';
const MOCK_AXIOS_PUT_RESPONSE = {
  data: MOCK_AXIOS_PUT_RESPONSE_DATA,
};
const MOCK_AXIOS_POST_RESPONSE_DATA = 'ANY_AXIOS_POST_RESPONSE_DATA';
const MOCK_AXIOS_POST_RESPONSE = {
  data: MOCK_AXIOS_POST_RESPONSE_DATA,
};
const MOCK_ERROR = new Error('ANY_ERROR');

jest.mock('axios', () => ({
  put: jest.fn(),
  post: jest.fn(),
}));
jest.mock('graphql-tag', () => jest.fn());
jest.mock('graphql', () => ({
  print: jest.fn(),
}));
jest.mock('../../clients/sqs', () => ({
  sqs: {},
}));
jest.mock('../../lib/getSignedRequest', () => ({
  getSignedRequest: jest.fn(),
}));
jest.mock('../../lib/sqs', () => ({
  deleteMessageBatch: jest.fn(),
}));
jest.mock('../dataPersistingHandlerConfig', () => ({
  AWS_REGION: MOCK_AWS_REGION,
  graphQLApiUrl: MOCK_GRAPHQL_API_URL,
  sqsQueueUrl: MOCK_SQS_QUEUE_URL,
  esSearchDomainEndpoint: MOCK_ES_SEARCH_DOMAIN_ENDPOINT,
  indexName: MOCK_INDEX_NAME,
}));

const axios = require('axios');
const gql = require('graphql-tag');
const { print } = require('graphql');
const { sqs } = require('../../clients/sqs');
const { getSignedRequest } = require('../../lib/getSignedRequest');
const { deleteMessageBatch } = require('../../lib/sqs');

describe('dataPersistingHandler', () => {
  let mockLog;
  let mockError;
  let handler;
  beforeAll(() => {
    mockLog = jest.spyOn(console, 'log').mockImplementation();
    mockError = jest.spyOn(console, 'error').mockImplementation();
  });
  afterAll(() => {
    mockLog.mockRestore();
    mockError.mockRestore();
  });
  beforeEach(() => {
    gql.mockReturnValue(MOCK_GQL_RESULT);
    print.mockReturnValue(MOCK_PRINT_RESULT);
    getSignedRequest.mockReturnValue(MOCK_SIGNED_REQUEST);
    axios.put.mockResolvedValue(MOCK_AXIOS_PUT_RESPONSE);
    axios.post.mockResolvedValue(MOCK_AXIOS_POST_RESPONSE);
    deleteMessageBatch.mockResolvedValue();
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      ({ handler } = require('../dataPersistingHandler'));
    });
  });

  it('works with empty event', async () => {
    await expect(handler()).resolves.toEqual();
    expect(gql).toHaveBeenCalledTimes(1);
    expect(gql).toHaveBeenCalledWith([expect.any(String)]);
    expect(print).not.toHaveBeenCalled();
    expect(getSignedRequest).not.toHaveBeenCalled();
    expect(axios.put).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
    expect(deleteMessageBatch).not.toHaveBeenCalled();
  });

  it('persists the data directly to ES if seeding', async () => {
    await expect(handler(MOCK_EVENT)).resolves.toEqual();
    expect(gql).toHaveBeenCalledTimes(1);
    expect(gql).toHaveBeenCalledWith([expect.any(String)]);
    expect(print).not.toHaveBeenCalled();
    expect(getSignedRequest).toHaveBeenCalledTimes(MOCK_EVENT.Records.length);
    expect(getSignedRequest).toHaveBeenCalledWith(
      `https://${MOCK_ES_SEARCH_DOMAIN_ENDPOINT}/${MOCK_INDEX_NAME}/_doc/${MOCK_ID}`,
      'PUT',
      {
        coordinates: [MOCK_LON, MOCK_LAT],
        id: MOCK_ID,
        mag: MOCK_MAG,
        time: MOCK_TIME,
        title: MOCK_TITLE,
      },
      MOCK_AWS_REGION,
      'es',
    );
    expect(axios.put).toHaveBeenCalledTimes(RECORDS_COUNT);
    expect(axios.put).toHaveBeenCalledWith(
      `https://${MOCK_ES_SEARCH_DOMAIN_ENDPOINT}/${MOCK_INDEX_NAME}/_doc/${MOCK_ID}`,
      MOCK_SIGNED_REQUEST_BODY,
      { headers: MOCK_SIGNED_REQUEST_HEADERS },
    );
    expect(axios.post).not.toHaveBeenCalled();
    expect(deleteMessageBatch).toHaveBeenCalledTimes(1);
    expect(deleteMessageBatch).toHaveBeenCalledWith(
      sqs,
      MOCK_SQS_QUEUE_URL,
      [...new Array(RECORDS_COUNT)].map(
        () => ({ Id: 'ANY_MESSAGE_ID', ReceiptHandle: 'ANY_RECEIPT_HANDLE' }),
      ),
    );
  });

  it('persists the data through AppSync if not seeding', async () => {
    await expect(
      handler({
        Records: MOCK_EVENT.Records.map((record) => ({
          ...record,
          body: JSON.stringify({
            ...MOCK_RECORD,
            seeding: false,
          }),
        })),
      }),
    ).resolves.toEqual();
    expect(gql).toHaveBeenCalledTimes(1);
    expect(gql).toHaveBeenCalledWith([expect.any(String)]);
    expect(print).toHaveBeenCalledTimes(RECORDS_COUNT);
    expect(print).toHaveBeenCalledWith(MOCK_GQL_RESULT);
    expect(getSignedRequest).toHaveBeenCalledTimes(RECORDS_COUNT);
    expect(getSignedRequest).toHaveBeenCalledWith(
      MOCK_GRAPHQL_API_URL, 'POST', {
        query: MOCK_PRINT_RESULT,
        variables: {
          coordinates: [MOCK_LON, MOCK_LAT],
          id: MOCK_ID,
          mag: MOCK_MAG,
          time: MOCK_TIME,
          title: MOCK_TITLE,
        },
      },
      MOCK_AWS_REGION,
      'appsync',
    );
    expect(axios.put).not.toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledTimes(RECORDS_COUNT);
    expect(axios.post).toHaveBeenCalledWith(
      MOCK_GRAPHQL_API_URL,
      MOCK_SIGNED_REQUEST_BODY,
      { headers: MOCK_SIGNED_REQUEST_HEADERS },
    );
    expect(deleteMessageBatch).toHaveBeenCalledTimes(1);
    expect(deleteMessageBatch).toHaveBeenCalledWith(
      sqs,
      MOCK_SQS_QUEUE_URL,
      [...new Array(RECORDS_COUNT)].map(
        () => ({ Id: 'ANY_MESSAGE_ID', ReceiptHandle: 'ANY_RECEIPT_HANDLE' }),
      ),
    );
  });

  it('rejects on error, does not remove messages from SQS', async () => {
    axios.post.mockResolvedValue({
      ...MOCK_AXIOS_POST_RESPONSE,
      data: { errors: [MOCK_ERROR] },
    });
    await expect(
      handler({
        Records: MOCK_EVENT.Records.map((record) => ({
          ...record,
          body: JSON.stringify({
            ...MOCK_RECORD,
            seeding: false,
          }),
        })),
      }),
    ).rejects.toEqual(MOCK_ERROR);
    expect(gql).toHaveBeenCalledTimes(1);
    expect(gql).toHaveBeenCalledWith([expect.any(String)]);
    expect(print).toHaveBeenCalledTimes(1);
    expect(print).toHaveBeenCalledWith(MOCK_GQL_RESULT);
    expect(getSignedRequest).toHaveBeenCalledTimes(1);
    expect(getSignedRequest).toHaveBeenCalledWith(
      MOCK_GRAPHQL_API_URL, 'POST', {
        query: MOCK_PRINT_RESULT,
        variables: {
          coordinates: [MOCK_LON, MOCK_LAT],
          id: MOCK_ID,
          mag: MOCK_MAG,
          time: MOCK_TIME,
          title: MOCK_TITLE,
        },
      },
      MOCK_AWS_REGION,
      'appsync',
    );
    expect(axios.put).not.toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      MOCK_GRAPHQL_API_URL,
      MOCK_SIGNED_REQUEST_BODY,
      { headers: MOCK_SIGNED_REQUEST_HEADERS },
    );
    expect(deleteMessageBatch).not.toHaveBeenCalled();
  });
});
