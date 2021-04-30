const MOCK_SSM = {
  getParameter: jest.fn(),
  putParameter: jest.fn(),
};
const MOCK_PARAM_NAME = 'ANY_PARAM_NAME';
const MOCK_PARAM_VALUE = 'ANY_PARAM_VALUE';
const MOCK_GET_PARAMETER_RESULT = {
  Parameter: {
    Value: MOCK_PARAM_VALUE,
  },
};
const MOCK_PUT_PARAMETER_RESULT = 'ANY_PUT_PARAMETER_RESULT';

const { getParameter, putParameter } = require('../ssm');

describe('ssm', () => {
  describe('getParameter', () => {
    beforeEach(() => {
      MOCK_SSM.getParameter.mockImplementation(() => ({
        promise: jest.fn().mockResolvedValue(MOCK_GET_PARAMETER_RESULT),
      }));
    });
    it('gets the parameter', async () => {
      await expect(getParameter(MOCK_SSM, MOCK_PARAM_NAME))
        .resolves.toEqual(MOCK_PARAM_VALUE);
      expect(MOCK_SSM.getParameter).toHaveBeenCalledWith({
        Name: MOCK_PARAM_NAME,
      });
    });
  });

  describe('putParameter', () => {
    beforeEach(() => {
      MOCK_SSM.putParameter.mockImplementation(() => ({
        promise: jest.fn().mockResolvedValue(MOCK_PUT_PARAMETER_RESULT),
      }));
    });
    it('puts the parameter', async () => {
      await expect(putParameter(MOCK_SSM, MOCK_PARAM_NAME, MOCK_PARAM_VALUE))
        .resolves.toEqual(MOCK_PUT_PARAMETER_RESULT);
      expect(MOCK_SSM.putParameter).toHaveBeenCalledWith({
        Name: MOCK_PARAM_NAME,
        Value: MOCK_PARAM_VALUE,
        Overwrite: true,
      });
    });
  });
});
