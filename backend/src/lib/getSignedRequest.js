const { URL } = require('url');
const AWS = require('aws-sdk');

const getSignedRequest = (url, method, body, region, scope) => {
  const req = new AWS.HttpRequest(url, region);
  const { hostname } = new URL(url);
  req.method = method;
  req.headers.host = hostname;
  req.headers['Content-Type'] = 'application/json';
  req.headers.Accept = 'application/json';
  req.body = JSON.stringify(body);
  const signer = new AWS.Signers.V4(req, scope);
  signer.addAuthorization(AWS.config.credentials, AWS.util.date.getDate());
  return req;
};

module.exports = {
  getSignedRequest,
};
