const MOCK_SQS = {};

jest.mock('aws-sdk', () => ({
  SQS: jest.fn(),
}));

const { SQS } = require('aws-sdk');

describe('sqs', () => {
  let sqs;
  beforeEach(() => {
    SQS.mockImplementation(() => MOCK_SQS);
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      ({ sqs } = require('../sqs'));
    });
  });
  it('instantiates the sqs client', () => {
    expect(sqs).toEqual(MOCK_SQS);
    expect(SQS).toHaveBeenCalledWith();
  });
});
