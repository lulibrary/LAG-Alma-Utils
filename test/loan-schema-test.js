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
const LoanSchema = rewire('../src/loan-schema')

const TestLoanModel = LoanSchema('loanTable')

describe('loan schema tests', function () {
  this.timeout(5000)

  before(function () {
    this.timeout(25000)
    process.env.AWS_ACCESS_KEY_ID = 'key'
    process.env.AWS_SECRET_ACCESS_KEY = 'key2'
    return require('./dynamodb-local')('loanTable', 'loan_id')
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

  describe('calculate expiry tests', () => {
    const calculateExpiry = LoanSchema.__get__('calculateExpiry')

    it('should return 0 for the unix epoch', () => {
      calculateExpiry('1970-01-01T00:00:00Z').should.equal(0)
    })

    it('should return 0 if no value is passed', () => {
      let model = {}
      calculateExpiry(model.due_date).should.equal(0)
    })

    it('should return a time in seconds', () => {
      calculateExpiry('1970-01-01T00:00:01Z').should.equal(1)
    })
  })

  describe('model tests', () => {
    after(() => {
      AWS_MOCK.restore('DynamoDB')
    })

    it('should set the expiry date if the due date is set', () => {
      const putStub = sandbox.stub()
      putStub.callsArgWith(1, null, true)
      AWS_MOCK.mock('DynamoDB', 'putItem', putStub)

      AWS_MOCK.mock('DynamoDB', 'describeTable', true)

      let testLoan = new TestLoanModel({
        loan_id: 'a loan',
        due_date: '1970-01-01T00:00:00Z',
        test: 'test'
      })

      testLoan.save()

      testLoan.expiry_date.should.equal(0)
    })
  })

  describe('schema tests', () => {
    it('should accept all desired parameters with correct types', function () {
      const testID = uuid()
      const testLoanData = {
        loan_id: testID,
        user_id: 'a user',
        renewable: true,
        call_number: 'a call number',
        loan_status: 'a loan status',
        due_date: '1970-01-01T00:00:01Z',
        item_barcode: 'a barcode',
        mms_id: 'a mms id',
        title: 'a title',
        author: 'an author',
        description: 'a description',
        publication_year: 'a year',
        process_status: 'a status'
      }

      const expected = {
        loan_id: testID,
        user_id: 'a user',
        renewable: true,
        call_number: 'a call number',
        loan_status: 'a loan status',
        due_date: '1970-01-01T00:00:01Z',
        expiry_date: 1,
        item_barcode: 'a barcode',
        mms_id: 'a mms id',
        title: 'a title',
        author: 'an author',
        description: 'a description',
        publication_year: 'a year',
        process_status: 'a status'
      }

      return new Promise((resolve, reject) => {
        TestLoanModel.create(testLoanData, (err, data) => {
          err ? reject(err) : resolve(data)
        })
      })
        .then(() => {
          return docClient.get({
            Key: { loan_id: testID },
            TableName: 'loanTable'
          }).promise().then((data) => {
            data.Item.should.deep.equal(expected)
          })
        })
    })

    it('should remove parameters not in the schema', () => {
      const testID = `${uuid()}`
      const testLoanData = {
        loan_id: testID,
        bad_param: 'danger'
      }

      return new Promise((resolve, reject) => {
        TestLoanModel.create(testLoanData, (err, data) => {
          err ? reject(err) : resolve(data)
        })
      })
        .then(() => {
          return docClient.get({
            Key: { loan_id: testID },
            TableName: 'loanTable'
          }).promise().then((data) => {
            data.Item.should.deep.equal({ loan_id: testID, expiry_date: 0 })
          })
        })
    })

    describe('getValid method tests', () => {
      it('should return a record with an expiry date in the future', () => {
        const stubTime = 0

        const testLoanID = `test_loan_${uuid()}`

        return new TestLoanModel({
          loan_id: testLoanID,
          expiry_date: 1000
        }).save()
          .then(() => {
            sandbox.stub(Date, 'now').returns(stubTime)

            return TestLoanModel.getValid(testLoanID)
              .then(user => {
                user.should.be.an('object')
                user.loan_id.should.equal(testLoanID)
              })
          })
      })

      it('should not return a record with an expiry date in the past', () => {
        const stubTime = 1000

        const testLoanID = `test_loan_${uuid()}`

        return new TestLoanModel({
          loan_id: testLoanID,
          expiry_date: 0
        }).save()
          .then(() => {
            sandbox.stub(Date, 'now').returns(stubTime)

            return TestLoanModel.getValid(testLoanID)
              .should.eventually.deep.equal(null)
          })
      })

      it('should not return a record if no matching record exists', () => {
        const testLoanID = `test_loan_${uuid()}`

        return TestLoanModel.getValid(testLoanID)
          .should.eventually.deep.equal(null)
      })
    })
  })
})
