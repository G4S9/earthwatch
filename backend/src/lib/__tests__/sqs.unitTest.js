const MOCK_SQS = {
  sendMessageBatch: jest.fn(),
  deleteMessageBatch: jest.fn(),
};
const MOCK_SQS_QUEUE_URL = 'ANY_SQS_QUEUE_URL';
const MOCK_SEND_MESSAGE_BATCH_RESPONSE = 'ANY_SEND_MESSAGE_BATCH_RESPONSE';
const MOCK_DELETE_MESSAGE_BATCH_RESPONSE = 'ANY_DELETE_MESSAGE_BATCH_RESPONSE';
const MOCK_ENTRY_1 = 'ANY_ENTRY_1';
const MOCK_ENTRY_2 = 'ANY_ENTRY_2';
const MOCK_ENTRIES = [MOCK_ENTRY_1, MOCK_ENTRY_2];

const { sendMessageBatch, deleteMessageBatch } = require('../sqs');

describe('sqs', () => {
  describe('sendMessageBatch', () => {
    beforeEach(() => {
      MOCK_SQS.sendMessageBatch.mockImplementation(() => ({
        promise: jest.fn().mockResolvedValue(MOCK_SEND_MESSAGE_BATCH_RESPONSE),
      }));
    });
    it('sends the message batch', async () => {
      await expect(sendMessageBatch(MOCK_SQS, MOCK_SQS_QUEUE_URL, MOCK_ENTRIES))
        .resolves.toEqual(MOCK_SEND_MESSAGE_BATCH_RESPONSE);
      expect(MOCK_SQS.sendMessageBatch).toHaveBeenCalledWith({
        QueueUrl: MOCK_SQS_QUEUE_URL,
        Entries: MOCK_ENTRIES,
      });
    });
  });

  describe('deleteMessageBatch', () => {
    beforeEach(() => {
      MOCK_SQS.deleteMessageBatch.mockImplementation(() => ({
        promise: jest.fn().mockResolvedValue(MOCK_DELETE_MESSAGE_BATCH_RESPONSE),
      }));
    });
    it('deletes the message batch', async () => {
      await expect(deleteMessageBatch(MOCK_SQS, MOCK_SQS_QUEUE_URL, MOCK_ENTRIES))
        .resolves.toEqual(MOCK_DELETE_MESSAGE_BATCH_RESPONSE);
      expect(MOCK_SQS.deleteMessageBatch).toHaveBeenCalledWith({
        QueueUrl: MOCK_SQS_QUEUE_URL,
        Entries: MOCK_ENTRIES,
      });
    });
  });
});
