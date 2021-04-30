const AWS = require('aws-sdk');
const { sendMessageBatch, deleteMessageBatch } = require('../sqs');

const sqs = new AWS.SQS({
  region: process.env.AWS_REGION,
  endpoint: 'http://127.0.0.1:4566',
});

const MOCK_QUEUE_NAME = 'ANY_QUEUE_NAME';

const MOCK_ID_1 = '1';
const MOCK_ID_2 = '2';
const MOCK_ENTRY_1 = { Id: MOCK_ID_1, MessageBody: JSON.stringify({ id: MOCK_ID_1 }) };
const MOCK_ENTRY_2 = { Id: MOCK_ID_2, MessageBody: JSON.stringify({ id: MOCK_ID_2 }) };
const MOCK_ENTRIES = [MOCK_ENTRY_1, MOCK_ENTRY_2];

describe('sqs', () => {
  let queueUrl;
  beforeAll(async () => {
    queueUrl = (await sqs.createQueue({
      QueueName: MOCK_QUEUE_NAME,
    }).promise()).QueueUrl;
  });
  afterAll(async () => {
    await sqs.deleteQueue({
      QueueUrl: queueUrl,
    }).promise();
  });
  it('can send the messages', async () => {
    await expect(sendMessageBatch(sqs, queueUrl, MOCK_ENTRIES))
      .resolves.toEqual(expect.objectContaining({
        Failed: [],
        Successful: MOCK_ENTRIES.map(({ Id }) => expect.objectContaining({ Id })),
      }));
  });
  it('can delete the messages', async () => {
    const receiveMessageResponse = await sqs.receiveMessage({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
    }).promise();
    expect(receiveMessageResponse.Messages.length).toBe(MOCK_ENTRIES.length);
    await expect(deleteMessageBatch(
      sqs,
      queueUrl,
      receiveMessageResponse.Messages.map(
        ({ MessageId: Id, ReceiptHandle }) => ({ Id, ReceiptHandle }),
      ),
    )).resolves.toEqual(expect.objectContaining({
      Failed: [],
      Successful: receiveMessageResponse.Messages.map(
        ({ MessageId: Id }) => ({ Id }),
      ),
    }));
  });
});
