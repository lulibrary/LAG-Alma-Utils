const AWS_MOCK = require('aws-sdk-mock')

const sinon = require('sinon')
const sandbox = sinon.sandbox.create()

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
const should = chai.should()

const rewire = require('rewire')

const Model = require('dynamoose').Model
const LoanSchema = require('../src/loan-schema')
const RequestSchema = require('../src/request-schema')

// Module under test
const UserSchema = rewire('../src/user-schema')

const testUserTable = {
  name: 'usertable',
  region: 'eu-west-2'
}

const TestUserModel = UserSchema(testUserTable)

describe('user schema tests', () => {
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
    it('should add a request to the user if it does not already have the loan', () => {
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

  describe('get loan data tests', () => {
    it('should create an empty array of loans if no loan ids are present', () => {
      let testUser = new TestUserModel({
        primary_id: 'test user',
        loan_ids: []
      })

      should.not.exist(testUser.loans)

      return testUser.getLoanData(null).should.eventually.deep.equal([])
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

      return testUser.getLoanData(testLoanModel).then(() => {
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

      return testUser.getLoanData(testLoanModel).then(() => {
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

      return testUser.getLoanData(testLoanModel).then(() => {
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

      return testUser.getLoanData(testLoanModel).then(() => {
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

      return testUser.getRequestData(null).should.eventually.deep.equal([])
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

      return testUser.getRequestData(testRequestModel).then(() => {
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

      return testUser.getRequestData(testRequestModel).then(() => {
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

      return testUser.getRequestData(testRequestModel).then(() => {
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

      return testUser.getRequestData(testRequestModel).then(() => {
        testUser.requests.should.deep.equal(expected)
      })
    })
  })
})
