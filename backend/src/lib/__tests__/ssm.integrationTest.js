const AWS = require('aws-sdk');
const { getParameter, putParameter } = require('../ssm');

const ssm = new AWS.SSM({
  region: process.env.AWS_REGION,
  endpoint: 'http://127.0.0.1:4566',
});

const MOCK_PARAM_NAME = 'ANY_PARAM_NAME';
const MOCK_PARAM_VALUE = 'ANY_PARAM_VALUE';

describe('ssm', () => {
  it('can put parameter', async () => {
    await expect(putParameter(ssm, MOCK_PARAM_NAME, MOCK_PARAM_VALUE))
      .resolves.toEqual(expect.objectContaining({ Version: 1 }));
  });
  it('can overwrite the parameter', async () => {
    await expect(putParameter(ssm, MOCK_PARAM_NAME, MOCK_PARAM_VALUE))
      .resolves.toEqual(expect.objectContaining({ Version: 2 }));
  });
  it('can get parameter', async () => {
    await expect(getParameter(ssm, MOCK_PARAM_NAME))
      .resolves.toEqual(MOCK_PARAM_VALUE);
  });
});
