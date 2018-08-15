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

  afterEach(() => {
    sandbox.restore()
  })

  describe('schema tests', () => {
    it('should accept all desired parameters with correct types', function () {
      const dateStub = sandbox.stub(Date, 'now')
      dateStub.returns(1000000)

      const testID = uuid()
      const testFeeData = {
        id: testID,
        user_primary_id: {
          value: 'a user',
          link: 'http://a.link.for.user'
        },
        type: {
          value: 'a type',
          desc: 'this is a type'
        },
        status: {
          value: 'a status',
          desc: 'this is a status'
        },
        balance: 123456,
        remaining_vat_amount: 12345,
        original_amount: 100.00,
        original_vat_amount: 99,
        creation_time: 'a time',
        status_time: 'another time',
        comment: 'a comment',
        owner: {
          value: 'a owner',
          desc: 'this is an owner'
        },
        title: 'a title',
        barcode: 'a barcode',
        link: 'a link',
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
        user_primary_id: {
          value: 'a user',
          link: 'http://a.link.for.user'
        },
        type: {
          value: 'a type',
          desc: 'this is a type'
        },
        status: {
          value: 'a status',
          desc: 'this is a status'
        },
        balance: 123456,
        remaining_vat_amount: 12345,
        original_amount: 100.00,
        original_vat_amount: 99,
        creation_time: 'a time',
        status_time: 'another time',
        comment: 'a comment',
        owner: {
          value: 'a owner',
          desc: 'this is an owner'
        },
        title: 'a title',
        barcode: 'a barcode',
        link: 'a link',
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
        }],
        expiry_date: 1000 + 2 * 7 * 24 * 60 * 60
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

    it('should allow for empty transaction arrays', () => {
      const dateStub = sandbox.stub(Date, 'now')
      dateStub.returns(0)

      const testID = uuid()
      const testFeeData = {
        id: testID,
        user_primary_id: {
          value: 'a user',
          link: 'a link'
        },
        transactions: []
      }

      const expected = {
        id: testID,
        user_primary_id: {
          value: 'a user',
          link: 'a link'
        },
        transactions: [],
        expiry_date: 2 * 7 * 24 * 60 * 60
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
      const dateStub = sandbox.stub(Date, 'now')
      dateStub.returns(0)

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
            data.Item.should.deep.equal({
              id: testID,
              expiry_date: 2 * 7 * 24 * 60 * 60
            })
          })
        })
    })

    it('should force the user_id value to lowercase', () => {
      sandbox.stub(Date, 'now').returns(0)

      const userUUID = uuid()
      const upcaseUserID = `TEST_USER_ID_${userUUID.toUpperCase()}`
      const lowercaseUserID = `test_user_id_${userUUID.toLowerCase()}`
      const testFeeID = uuid()

      const testLoanData = {
        id: testFeeID,
        user_primary_id: {
          value: upcaseUserID
        }
      }

      return new TestFeeModel(testLoanData).save()
        .then(() => {
          return docClient.get({
            Key: { id: testFeeID },
            TableName: 'feeTable'
          }).promise().then(res => {
            res.Item.should.deep.equal({
              id: testFeeID,
              user_primary_id: {
                value: lowercaseUserID
              },
              expiry_date: 2 * 7 * 24 * 60 * 60
            })
          })
        })
    })
  })
})
