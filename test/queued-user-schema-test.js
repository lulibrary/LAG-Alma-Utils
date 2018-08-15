const AWS = require('aws-sdk')

// **** DynamoDB
const dynamo = new AWS.DynamoDB({ endpoint: 'http://127.0.0.1:8000', region: 'eu-west-2' })

const dynamoose = require('dynamoose')
dynamoose.AWS.config.update({
  region: 'eu-west-2'
})
dynamoose.local()
const DynamoLocal = require('dynamodb-local')
const DynamoLocalPort = 8000
// ****

// **** Test Libraries
const sinon = require('sinon')
const sandbox = sinon.sandbox.create()

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
chai.should()
// ****

const uuid = require('uuid/v4')
const rewire = require('rewire')

// Module under test
const QueuedSchema = rewire('../src/queued-user-schema')

const testQueuedTable = 'queued_user_table'

const TestQueuedModel = QueuedSchema(testQueuedTable)

describe('user schema tests', function () {
  this.timeout(5000)
  before(function () {
    this.timeout(25000)
    process.env.AWS_ACCESS_KEY_ID = 'key'
    process.env.AWS_SECRET_ACCESS_KEY = 'key2'
    return require('./dynamodb-local')('queued_user_table', 'primary_id')
      .then(() => {
        return dynamo.listTables().promise().then((data) => {
          console.log('Tables:', data.TableNames)
        })
      })
  })

  after(() => {
    console.log('Tests complete')
    delete process.env.AWS_ACCESS_KEY_ID
    delete process.env.AWS_SECRET_ACCESS_KEY
    DynamoLocal.stop(DynamoLocalPort)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('model tests', () => {
    it('should set a default expiry of 5 minutes', () => {
      sandbox.stub(Date, 'now').returns(0)

      const testQueuedID = `test_queued_${uuid()}`

      return TestQueuedModel.create({
        primary_id: testQueuedID
      }, {
        overwrite: true
      })
        .then(() => {
          return TestQueuedModel.get(testQueuedID)
            .then(res => {
              Object.assign({}, res).should.deep.equal({
                primary_id: testQueuedID,
                expiry_date: 5 * 60
              })
            })
        })
    })
  })
})
