const MOCK_CREDENTIALS = 'ANY_CREDENTIALS';
const MOCK_HOSTNAME = 'ANY_HOSTNAME';
const MOCK_DATE = 'ANY_DATE';
const MOCK_URL = 'ANY_URL';
const MOCK_METHOD = 'ANY_METHOD';
const MOCK_BODY = 'ANY_BODY';
const MOCK_REGION = 'ANY_REGION';
const MOCK_SCOPE = 'ANY_SCOPE';

jest.mock('url', () => ({
  URL: jest.fn(),
}));

jest.mock('aws-sdk', () => ({
  HttpRequest: jest.fn(),
  Signers: {
    V4: jest.fn(),
  },
  config: {
    credentials: MOCK_CREDENTIALS,
  },
  util: {
    date: {
      getDate: jest.fn(),
    },
  },
}));

const { URL } = require('url');
const AWS = require('aws-sdk');
const { getSignedRequest } = require('../getSignedRequest');

describe('getSignedRequest', () => {
  let MOCK_URL_OBJ;
  let MOCK_REQ;
  let MOCK_SIGNER;
  beforeEach(() => {
    MOCK_URL_OBJ = { hostname: MOCK_HOSTNAME };
    MOCK_REQ = { headers: {} };
    MOCK_SIGNER = { addAuthorization: jest.fn() };
    URL.mockImplementation(() => MOCK_URL_OBJ);
    AWS.HttpRequest.mockImplementation(() => MOCK_REQ);
    AWS.Signers.V4.mockImplementation(() => MOCK_SIGNER);
    AWS.util.date.getDate.mockImplementation(() => MOCK_DATE);
  });
  it('returns a signed request', () => {
    expect(getSignedRequest(
      MOCK_URL, MOCK_METHOD, MOCK_BODY, MOCK_REGION, MOCK_SCOPE,
    )).toEqual({
      body: '"ANY_BODY"',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        host: 'ANY_HOSTNAME',
      },
      method: 'ANY_METHOD',
    });
    expect(AWS.HttpRequest).toHaveBeenCalledWith(MOCK_URL, MOCK_REGION);
    expect(URL).toHaveBeenCalledWith(MOCK_URL);
    expect(AWS.Signers.V4).toHaveBeenCalledWith(MOCK_REQ, MOCK_SCOPE);
    expect(MOCK_SIGNER.addAuthorization).toHaveBeenCalledWith(AWS.config.credentials, MOCK_DATE);
  });
});
