const MOCK_SEEDING_DONE_PARAM_NAME = 'ANY_SEEDING_DONE_PARAM_NAME';
const MOCK_SEEDING_DAYS = 'ANY_SEEDING_DAYS';
const MOCK_SEEDING_MINUTES = 'ANY_SEEDING_MINUTES';
const MOCK_SQS_QUEUE_URL = 'ANY_SQS_QUEUE_URL';
const MOCK_ID = 'ANY_ID';
const MOCK_LON = 'ANY_LON';
const MOCK_LAT = 'ANY_LAT';
const MOCK_TIME = 'ANY_TIME';
const MOCK_TITLE = 'ANY_TITLE';
const MOCK_MAG = 'ANY_MAG';
const MOCK_MATCHING_FEATURE = {
  id: MOCK_ID,
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [MOCK_LON, MOCK_LAT],
  },
  properties: {
    type: 'earthquake',
    time: MOCK_TIME,
    title: MOCK_TITLE,
    mag: MOCK_MAG,
  },
};
const MATCHING_FEATURE_COUNT = 11;
const MOCK_USGS_RESPONSE = {
  data: {
    features: [
      ...[...Array(MATCHING_FEATURE_COUNT)].map(() => MOCK_MATCHING_FEATURE),
      { ...MOCK_MATCHING_FEATURE, type: 'SOMETHING_ELSE' },
      // non-matching features below
      {
        ...MOCK_MATCHING_FEATURE,
        geometry: { ...MOCK_MATCHING_FEATURE.geometry, type: 'SOMETHING_ELSE' },
      },
      {
        ...MOCK_MATCHING_FEATURE,
        properties: {
          ...MOCK_MATCHING_FEATURE.properties,
          type: 'SOMETHING_ELSE',
        },
      },
      {
        ...MOCK_MATCHING_FEATURE,
        properties: { ...MOCK_MATCHING_FEATURE.properties, time: undefined },
      },
      {
        ...MOCK_MATCHING_FEATURE,
        properties: { ...MOCK_MATCHING_FEATURE.properties, title: undefined },
      },
      {
        ...MOCK_MATCHING_FEATURE,
        properties: { ...MOCK_MATCHING_FEATURE.properties, mag: undefined },
      },
    ],
  },
};
const MOCK_ERROR = new Error('ANY_ERROR');

jest.mock('axios', () => ({
  get: jest.fn(),
}));
jest.mock('../../clients/ssm', () => ({
  ssm: {},
}));
jest.mock('../../clients/sqs', () => ({
  sqs: {},
}));
jest.mock('../../lib/ssm', () => ({
  getParameter: jest.fn(),
  putParameter: jest.fn(),
}));
jest.mock('../../lib/sqs', () => ({
  sendMessageBatch: jest.fn(),
}));
jest.mock('../dataAcquisitionHandlerConfig', () => ({
  seedingDoneParamName: MOCK_SEEDING_DONE_PARAM_NAME,
  seedingDays: MOCK_SEEDING_DAYS,
  readBackMinutes: MOCK_SEEDING_MINUTES,
  sqsQueueUrl: MOCK_SQS_QUEUE_URL,
}));

const axios = require('axios');
const { ssm } = require('../../clients/ssm');
const { sqs } = require('../../clients/sqs');
const { getParameter, putParameter } = require('../../lib/ssm');
const { sendMessageBatch } = require('../../lib/sqs');

const { handler } = require('../dataAcquisitionHandler');

describe('dataAcquisitionHandler', () => {
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
    axios.get.mockResolvedValue(MOCK_USGS_RESPONSE);
    getParameter.mockResolvedValue('false');
    putParameter.mockResolvedValue();
    sendMessageBatch.mockResolvedValue();
  });
  it('fetches the data and pushes it into the SQS queue if seeding is true', async () => {
    await expect(handler()).resolves.toEqual();
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time-asc&starttime=NOW-${MOCK_SEEDING_DAYS}days`,
    );
    expect(getParameter).toHaveBeenCalledTimes(1);
    expect(getParameter).toHaveBeenCalledWith(
      ssm,
      MOCK_SEEDING_DONE_PARAM_NAME,
    );
    expect(putParameter).toHaveBeenCalledTimes(1);
    expect(putParameter).toHaveBeenCalledWith(
      ssm,
      MOCK_SEEDING_DONE_PARAM_NAME,
      'true',
    );
    expect(sendMessageBatch).toHaveBeenCalledTimes(
      MATCHING_FEATURE_COUNT ? Math.ceil(MATCHING_FEATURE_COUNT / 10) : 0,
    );
    expect(sendMessageBatch).toHaveBeenCalledWith(
      sqs,
      MOCK_SQS_QUEUE_URL,
      expect.arrayContaining([{
        Id: MOCK_ID,
        MessageBody: `{"id":"${MOCK_ID}","time":"${MOCK_TIME}","title":"${MOCK_TITLE}","mag":"${MOCK_MAG}","coordinates":{"lat":"${MOCK_LAT}","lon":"${MOCK_LON}"},"seeding":true}`,
      }]),
    );
  });
  it('fetches the data and pushes it into the SQS queue if seeding is false', async () => {
    getParameter.mockResolvedValue('true');
    await expect(handler()).resolves.toEqual();
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time-asc&starttime=NOW-${MOCK_SEEDING_MINUTES}minutes`,
    );
    expect(getParameter).toHaveBeenCalledTimes(1);
    expect(getParameter).toHaveBeenCalledWith(
      ssm,
      MOCK_SEEDING_DONE_PARAM_NAME,
    );
    expect(putParameter).toHaveBeenCalledTimes(0);
    expect(sendMessageBatch).toHaveBeenCalledTimes(
      MATCHING_FEATURE_COUNT ? Math.ceil(MATCHING_FEATURE_COUNT / 10) : 0,
    );
    expect(sendMessageBatch).toHaveBeenCalledWith(
      sqs,
      MOCK_SQS_QUEUE_URL,
      expect.arrayContaining([{
        Id: MOCK_ID,
        MessageBody: `{"id":"${MOCK_ID}","time":"${MOCK_TIME}","title":"${MOCK_TITLE}","mag":"${MOCK_MAG}","coordinates":{"lat":"${MOCK_LAT}","lon":"${MOCK_LON}"},"seeding":false}`,
      }]),
    );
  });
  it('rejects on error', async () => {
    getParameter.mockImplementation(() => Promise.reject(MOCK_ERROR));
    await expect(handler()).rejects.toEqual(MOCK_ERROR);
  });
  it('can handle zero features', async () => {
    axios.get.mockResolvedValue({
      ...MOCK_USGS_RESPONSE,
      data: {
        ...MOCK_USGS_RESPONSE.data,
        features: [],
      },
    });
    await expect(handler()).resolves.toEqual();
  });
  it('can handle missing data', async () => {
    axios.get.mockResolvedValue({
      ...MOCK_USGS_RESPONSE,
      data: undefined,
    });
    await expect(handler()).resolves.toEqual();
  });
});
