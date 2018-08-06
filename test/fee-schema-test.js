const AWS_MOCK = require('aws-sdk-mock')
const AWS = require('aws-sdk')
const docClient = new AWS.DynamoDB.DocumentClient({ endpoint: 'http://127.0.0.1:8000', region: 'eu-west-2' })

const sinon = require('sinon')
const sandbox = sinon.sandbox.create()

const dynamoose = require('dynamoose')
dynamoose.AWS.config.update({
  region: 'eu-west-2'
})
dynamoose.local()

const DynamoLocal = require('dynamodb-local')
const DynamoLocalPort = 8000

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
chai.should()

const rewire = require('rewire')

const uuid = require('uuid/v4')

// Module under test
const FeeSchema = rewire('../src/fee-schema')

const TestFeeModel = FeeSchema('feeTable')

describe('fee schema tests', function () {
  this.timeout(5000)

  before(function () {
    this.timeout(25000)
    process.env.AWS_ACCESS_KEY_ID = 'key'
    process.env.AWS_SECRET_ACCESS_KEY = 'key2'
    return require('./dynamodb-local')('feeTable', 'id')
  })

  after(() => {
    console.log('Tests complete')
    delete process.env.AWS_ACCESS_KEY_ID
    delete process.env.AWS_SECRET_ACCESS_KEY
    DynamoLocal.stop(DynamoLocalPort)
  })

  describe('schema tests', () => {
    it('should accept all desired parameters with correct types', function () {
      const testID = uuid()
      const testFeeData = {
        id: testID,
        user_primary_id: 'a user',
        type: 'a type',
        status: 'a status',
        balance: 123456,
        remaining_vat_amount: 12345,
        original_amount: 100.00,
        original_vat_amount: 99,
        creation_time: 1234567890,
        status_time: 9876543210,
        comment: 'a comment',
        owner: 'an owner',
        title: 'a title',
        barcode: 'a barcode',
        bursar_transaction_id: 'a transaction id',
        transactions: [{
          transaction: '1',
          thing: 'things'
        }, {
          transaction: '2',
          thing1: 'things'
        }, {
          transaction: 'potato',
          thing2: 'things'
        }]
      }

      const expected = {
        id: testID,
        user_primary_id: 'a user',
        type: 'a type',
        status: 'a status',
        balance: 123456,
        remaining_vat_amount: 12345,
        original_amount: 100.00,
        original_vat_amount: 99,
        creation_time: 1234567890,
        status_time: 9876543210,
        comment: 'a comment',
        owner: 'an owner',
        title: 'a title',
        barcode: 'a barcode',
        bursar_transaction_id: 'a transaction id',
        transactions: [{
          transaction: '1',
          thing: 'things'
        }, {
          transaction: '2',
          thing1: 'things'
        }, {
          transaction: 'potato',
          thing2: 'things'
        }]
      }

      return new Promise((resolve, reject) => {
        TestFeeModel.create(testFeeData, (err, data) => {
          err ? reject(err) : resolve(data)
        })
      })
        .then(() => {
          return TestFeeModel.get(testID)
            .then((data) => {
              Object.assign({}, data).should.deep.equal(expected)
            })
        })
    })

    it('should remove parameters not in the schema', () => {
      const testID = `${uuid()}`
      const testFeeData = {
        id: testID,
        bad_param: 'danger'
      }

      return new Promise((resolve, reject) => {
        TestFeeModel.create(testFeeData, (err, data) => {
          err ? reject(err) : resolve(data)
        })
      })
        .then(() => {
          return docClient.get({
            Key: { id: testID },
            TableName: 'feeTable'
          }).promise().then((data) => {
            data.Item.should.deep.equal({ id: testID })
          })
        })
    })
  })
})
