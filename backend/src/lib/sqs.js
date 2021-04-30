const sendMessageBatch = async (sqs, sqsQueueUrl, entries) => (
  sqs.sendMessageBatch({
    QueueUrl: sqsQueueUrl,
    Entries: entries,
  }).promise()
);

const deleteMessageBatch = async (sqs, sqsQueueUrl, entries) => (
  sqs.deleteMessageBatch({
    QueueUrl: sqsQueueUrl,
    Entries: entries,
  }).promise()
);

module.exports = {
  sendMessageBatch,
  deleteMessageBatch,
};
