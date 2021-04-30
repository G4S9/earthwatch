const MOCK_SSM = {};

jest.mock('aws-sdk', () => ({
  SSM: jest.fn(),
}));

const { SSM } = require('aws-sdk');

describe('ssm', () => {
  let ssm;
  beforeEach(() => {
    SSM.mockImplementation(() => MOCK_SSM);
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      ({ ssm } = require('../ssm'));
    });
  });
  it('instantiates the ssm client', () => {
    expect(ssm).toEqual(MOCK_SSM);
    expect(SSM).toHaveBeenCalledWith();
  });
});
