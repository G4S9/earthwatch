const AWS = require('aws-sdk');

const sqs = new AWS.SQS();

module.exports = {
  sqs,
};
