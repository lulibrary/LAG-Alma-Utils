const AWS_MOCK = require('aws-sdk-mock')
const AWS = require('aws-sdk')

// **** DynamoDB
const docClient = new AWS.DynamoDB.DocumentClient({ endpoint: 'http://127.0.0.1:8000', region: 'eu-west-2' })
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
const should = chai.should()
// ****

const uuid = require('uuid/v4')
const rewire = require('rewire')

const LoanSchema = require('../src/loan-schema')
const RequestSchema = require('../src/request-schema')

// Module under test
const UserSchema = rewire('../src/user-schema')

const testUserTable = 'usertable'

const TestUserModel = UserSchema(testUserTable)

const Model = require('dynamoose/lib/Model')

describe('user schema tests', function () {
  this.timeout(5000)
  before(function () {
    this.timeout(25000)
    process.env.AWS_ACCESS_KEY_ID = 'key'
    process.env.AWS_SECRET_ACCESS_KEY = 'key2'
    return require('./dynamodb-local')('usertable', 'primary_id')
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

  describe('calculate expiry tests', () => {
    const calculateExpiry = UserSchema.__get__('calculateExpiry')
    const stubTime = 0

    it('should return the current time + the amount specified in the offset', () => {
      sandbox.stub(Date, 'now').returns(stubTime)

      const offset = {
        value: 2,
        unit: 'hours'
      }

      const expected = stubTime + 2 * 3600

      calculateExpiry(offset).should.equal(expected)
    })
  })

  describe('model tests', () => {
    after(() => {
      AWS_MOCK.restore('DynamoDB')
    })

    it('should set the expiry date for record', () => {
      const stubTime = 0

      let testUser = new TestUserModel({
        primary_id: 'test user',
        loan_ids: []
      })

      const putStub = sandbox.stub()
      putStub.callsArgWith(1, null, true)
      AWS_MOCK.mock('DynamoDB', 'putItem', putStub)

      AWS_MOCK.mock('DynamoDB', 'describeTable', true)

      sandbox.stub(Date, 'now').returns(stubTime)
      const expected = stubTime + 2 * 3600

      testUser.save()

      testUser.expiry_date.should.equal(expected)
    })
  })

  describe('schema tests', () => {
    it('should default the loan_ids, request_ids and fee_ids to empty arrays', () => {
      const testUserID = uuid()
      sandbox.stub(Date, 'now').returns(0)

      return new TestUserModel({
        primary_id: testUserID
      }).save()
        .then(() => {
          return TestUserModel.get(testUserID)
            .then(res => {
              Object.assign({}, res).should.deep.equal({
                primary_id: testUserID,
                loan_ids: [],
                request_ids: [],
                fee_ids: [],
                expiry_date: 7200
              })
            })
        })
    })

    it('should save user IDs as lowercase', () => {
      sandbox.stub(Date, 'now').returns(0)

      const testUUID = uuid()
      const testUserID = `test_user_${testUUID.toLowerCase()}`
      const testUpcaseID = `TEST_USER_${testUUID.toUpperCase()}`

      return new TestUserModel({
        primary_id: testUpcaseID,
        loan_ids: []
      }).save()
        .then(res => {
          return TestUserModel.get(testUserID)
            .then(res => {
              Object.assign({}, res).should.deep.equal({
                primary_id: testUserID,
                loan_ids: [],
                request_ids: [],
                fee_ids: [],
                expiry_date: 7200
              })
            })
        })
    })

    it('should match a queried uppercase ID to a lowercase ID on a record', () => {
      sandbox.stub(Date, 'now').returns(0)

      const testUUID = uuid()
      const testUserID = `test_user_${testUUID.toLowerCase()}`
      const testUpcaseID = `TEST_USER_${testUUID.toUpperCase()}`

      return new TestUserModel({
        primary_id: testUserID,
        loan_ids: []
      }).save()
        .then(() => {
          return TestUserModel.get(testUpcaseID)
            .then(res => {
              Object.assign({}, res).should.deep.equal({
                primary_id: testUserID,
                loan_ids: [],
                request_ids: [],
                fee_ids: [],
                expiry_date: 7200
              })
            })
        })
    })
  })

  describe('getValid method tests', () => {
    it('should return a record with an expiry date in the future', () => {
      const stubTime = 0

      const testUserID = `test_user_${uuid()}`

      return new TestUserModel({
        primary_id: testUserID,
        loan_ids: [],
        expiry_date: 1000
      }).save()
        .then(() => {
          sandbox.stub(Date, 'now').returns(stubTime)

          return TestUserModel.getValid(testUserID)
            .then(user => {
              user.should.be.an('object')
              user.primary_id.should.equal(testUserID)
            })
        })
    })

    it('should not return a record with an expiry date in the past', () => {
      const stubTime = 1000

      const testUserID = `test_user_${uuid()}`

      return new TestUserModel({
        primary_id: testUserID,
        loan_ids: [],
        expiry_date: 0
      }).save()
        .then(() => {
          sandbox.stub(Date, 'now').returns(stubTime)

          return TestUserModel.getValid(testUserID)
            .should.eventually.deep.equal(null)
        })
    })

    it('should not return a record if no matching record exists', () => {
      const testUserID = `test_user_${uuid()}`

      return TestUserModel.getValid(testUserID)
        .should.eventually.deep.equal(null)
    })
  })

  describe('add method tests', () => {
    it('should add a loan to the user if it does not already have the loan', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        loan_ids: []
      })

      testUser.add('loan_ids', 'a loan')

      testUser.loan_ids.should.include('a loan')
    })

    it('should not add a loan if the user already has the loan', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        loan_ids: ['a loan']
      })

      testUser.add('loan_ids', 'a loan')

      testUser.loan_ids.should.deep.equal(['a loan'])
    })
  })

  describe('add loan method tests', () => {
    it('should add a loan to the user if it does not already have the loan', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        loan_ids: []
      })

      testUser.addLoan('a loan')

      testUser.loan_ids.should.include('a loan')
    })

    it('should not add a loan if the user already has the loan', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        loan_ids: ['a loan']
      })

      testUser.addLoan('a loan')

      testUser.loan_ids.should.deep.equal(['a loan'])
    })
  })

  describe('add request method tests', () => {
    it('should add a request to the user if it does not already have the request', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        request_ids: []
      })

      testUser.addRequest('a request')

      testUser.request_ids.should.include('a request')
    })

    it('should not add a request if the user already has the request', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        request_ids: ['a request']
      })

      testUser.addRequest('a request')

      testUser.request_ids.should.deep.equal(['a request'])
    })
  })

  describe('add fee method tests', () => {
    it('should add a fee to the user if it does not already have the fee', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        fee_ids: []
      })

      testUser.addFee('a fee')

      testUser.fee_ids.should.include('a fee')
    })

    it('should not add a fee if the user already has the fee', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        fee_ids: ['a fee']
      })

      testUser.addFee('a fee')

      testUser.fee_ids.should.deep.equal(['a fee'])
    })
  })

  describe('get loan data tests', () => {
    it('should create an empty array of loans if no loan ids are present', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        loan_ids: []
      })

      should.not.exist(testUser.loans)

      return testUser.populateLoans(null).then(() => {
        testUser.loans.should.deep.equal([])
      })
    })

    it('should call batchGet on the Loan model with an array of Keys', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        loan_ids: ['1', '2', '3']
      })

      let testLoanModel = LoanSchema('table')
      let batchGetStub = sandbox.stub(testLoanModel, 'batchGet')
      batchGetStub.resolves([])

      const expected = [{
        loan_id: '1'
      }, {
        loan_id: '2'
      }, {
        loan_id: '3'
      }]

      return testUser.populateLoans(testLoanModel).then(() => {
        batchGetStub.should.have.been.calledWith(expected)
      })
    })

    it('should call batchGet on the Loan model twice if the number of loans is over the batchGet limit', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        loan_ids: new Array(30).fill(0).map((value, index) => index.toString())
      })

      let testLoanModel = LoanSchema('table', 'region')
      let batchGetStub = sandbox.stub(testLoanModel, 'batchGet')
      batchGetStub.resolves([])

      return testUser.populateLoans(testLoanModel).then(() => {
        batchGetStub.should.have.been.calledTwice
      })
    })

    it('should return a populated list of loans from the model#batchGet response', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        loan_ids: ['1', '2', '3']
      })

      const expected = [{
        loan_id: '1',
        title: 'book1'
      }, {
        loan_id: '2',
        title: 'book2'
      }, {
        loan_id: '3',
        title: 'book3'
      }]

      let testLoanModel = LoanSchema('table', 'region')
      let batchGetStub = sandbox.stub(testLoanModel, 'batchGet')
      batchGetStub.resolves(expected)

      return testUser.populateLoans(testLoanModel).then(() => {
        testUser.loans.should.deep.equal(expected)
      })
    })

    it('should fully populate the loan list if multiple batchGet requests are made', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        loan_ids: new Array(30).fill(0).map((value, index) => index.toString())
      })

      const return1 = testUser.loan_ids.slice(0, 25).map(id => { return { loan_id: id, title: `book ${id}` } })
      const return2 = testUser.loan_ids.slice(25).map(id => { return { loan_id: id, title: `book ${id}` } })

      const expected = testUser.loan_ids.map(id => { return { loan_id: id, title: `book ${id}` } })

      let testLoanModel = LoanSchema('table', 'region')
      let batchGetStub = sandbox.stub(testLoanModel, 'batchGet')
      batchGetStub.onCall(0).resolves(return1)
      batchGetStub.onCall(1).resolves(return2)

      return testUser.populateLoans(testLoanModel).then(() => {
        testUser.loans.should.deep.equal(expected)
      })
    })
  })

  describe('get request data tests', () => {
    it('should create an empty array of requests if no requests ids are present', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        request_ids: []
      })

      should.not.exist(testUser.requests)

      return testUser.populateRequests(null).then(() => {
        testUser.requests.should.deep.equal([])
      })
    })

    it('should call batchGet on the Request model with an array of Keys', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        request_ids: ['1', '2', '3']
      })

      let testRequestModel = RequestSchema('table')
      let batchGetStub = sandbox.stub(testRequestModel, 'batchGet')
      batchGetStub.resolves([])

      const expected = [{
        request_id: '1'
      }, {
        request_id: '2'
      }, {
        request_id: '3'
      }]

      return testUser.populateRequests(testRequestModel).then(() => {
        batchGetStub.should.have.been.calledWith(expected)
      })
    })

    it('should call batchGet on the Loan model twice if the number of requests is over the batchGet limit', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        request_ids: new Array(30).fill(0).map((value, index) => index.toString())
      })

      let testRequestModel = RequestSchema('table')
      let batchGetStub = sandbox.stub(testRequestModel, 'batchGet')
      batchGetStub.resolves([])

      return testUser.populateRequests(testRequestModel).then(() => {
        batchGetStub.should.have.been.calledTwice
      })
    })

    it('should return a populated list of loans from the model#batchGet response', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        request_ids: ['1', '2', '3']
      })

      const expected = [{
        loan_id: '1',
        title: 'book1'
      }, {
        loan_id: '2',
        title: 'book2'
      }, {
        loan_id: '3',
        title: 'book3'
      }]

      let testRequestModel = RequestSchema('table')
      let batchGetStub = sandbox.stub(testRequestModel, 'batchGet')
      batchGetStub.resolves(expected)

      return testUser.populateRequests(testRequestModel).then(() => {
        testUser.requests.should.deep.equal(expected)
      })
    })

    it('should fully populate the loan list if multiple batchGet requests are made', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        request_ids: new Array(30).fill(0).map((value, index) => index.toString())
      })

      const return1 = testUser.request_ids.slice(0, 25).map(id => { return { request_id: id, title: `book ${id}` } })
      const return2 = testUser.request_ids.slice(25).map(id => { return { request_id: id, title: `book ${id}` } })

      const expected = testUser.request_ids.map(id => { return { request_id: id, title: `book ${id}` } })

      let testRequestModel = RequestSchema('table')
      let batchGetStub = sandbox.stub(testRequestModel, 'batchGet')
      batchGetStub.onCall(0).resolves(return1)
      batchGetStub.onCall(1).resolves(return2)

      return testUser.populateRequests(testRequestModel).then(() => {
        testUser.requests.should.deep.equal(expected)
      })
    })
  })

  describe('deleteItem method tests', () => {
    it('should remove all matching values from the array', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        request_ids: new Array(30).fill(0).map((value, index) => (index % 3).toString())
      })

      let expected = new Array(20).fill(0).map((value, index) => (index % 2).toString())

      testUser.deleteItem('request_ids', '2')

      testUser.request_ids.should.deep.equal(expected)
    })

    it('should not alter the array if no matching value is present', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        request_ids: new Array(30).fill(0).map((value, index) => (index % 3).toString())
      })

      let expected = new Array(30).fill(0).map((value, index) => (index % 3).toString())

      testUser.deleteItem('request_ids', '4')

      testUser.request_ids.should.deep.equal(expected)
    })

    it('should return the user object', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        request_ids: new Array(30).fill(0).map((value, index) => (index % 3).toString())
      })

      let user = testUser.deleteItem('request_ids', '2')
      user.should.deep.equal(testUser)
    })
  })

  describe('delete loan method tests', () => {
    it('should call User#deleteItem with the loan ID and the `loan_ids` field', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        loan_ids: new Array(30).fill(0).map((value, index) => (index % 3).toString())
      })

      const deleteStub = sandbox.stub(testUser, 'deleteItem')

      testUser.deleteLoan('loan')

      deleteStub.should.have.been.calledWithExactly('loan_ids', 'loan')
    })
  })

  describe('delete request method tests', () => {
    it('should call User#deleteItem with the request ID and the `request_ids` field', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        request_ids: new Array(30).fill(0).map((value, index) => (index % 3).toString())
      })

      const deleteStub = sandbox.stub(testUser, 'deleteItem')

      testUser.deleteRequest('request')

      deleteStub.should.have.been.calledWithExactly('request_ids', 'request')
    })
  })

  describe('delete fee method tests', () => {
    it('should call User#deleteItem with the fee ID and the `fee_ids` field', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        fee_ids: new Array(30).fill(0).map((value, index) => (index % 3).toString())
      })

      const deleteStub = sandbox.stub(testUser, 'deleteItem')

      testUser.deleteFee('test-fee')

      deleteStub.should.have.been.calledWithExactly('fee_ids', 'test-fee')
    })
  })
})
