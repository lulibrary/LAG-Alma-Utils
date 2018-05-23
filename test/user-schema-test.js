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
// const LoanSchema = require('../src/loan-schema')

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

  describe('add method tests', () => {
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

      let testLoanModel = LoanSchema('table', 'region')
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
})
