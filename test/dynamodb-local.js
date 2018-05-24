const AWS = require('aws-sdk')
const dynamo = new AWS.DynamoDB({ endpoint: 'http://127.0.0.1:8000', region: 'eu-west-2' })

const DynamoLocal = require('dynamodb-local')
DynamoLocal.configureInstaller({
  installPath: './dynamodblocal'
})

const DynamoLocalPort = 8000

module.exports = (tableName, key) => {
  return DynamoLocal.launch(DynamoLocalPort)
    .then(() => {
      console.log('DynamoDB Local started')
    })
    .then(() => {
      return setTimeout(Promise.resolve, 2500)
    })
    .then(() => {
      return dynamo.createTable({
        AttributeDefinitions: [
          {
            AttributeName: key,
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: key,
            KeyType: 'HASH'
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        },
        TableName: tableName
      }).promise()
    })
    .then(() => {
      console.log(`Table ${tableName} created with key ${key}`)
    })
    .catch(e => {
      console.log(e)
      throw e
    })
}
