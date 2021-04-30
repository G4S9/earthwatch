const getParameter = async (ssm, paramName) => (
  await ssm
    .getParameter({
      Name: paramName,
    })
    .promise()
)?.Parameter?.Value;

const putParameter = async (ssm, paramName, paramValue) => (
  ssm.putParameter({
    Name: paramName,
    Value: paramValue,
    Overwrite: true,
  }).promise()
);

module.exports = {
  getParameter,
  putParameter,
};
