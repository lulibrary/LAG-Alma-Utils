const sinon = require('sinon')
const sandbox = sinon.sandbox.create()

const DB = require('@lulibrary/lag-utils').DB

// Test libraries
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinonChai = require('sinon-chai')
chai.use(chaiAsPromised)
chai.use(sinonChai)
chai.should()

// Module under test
const User = require('../src/user')

describe('user class tests', () => {
  afterEach(() => {
    sandbox.restore()
  })

  describe('constructor tests', () => {
    it('should create a user that is not saveable', () => {
      let testUser = new User('construct-user', 'UserCacheTable', 'eu-west-2')
      testUser.saveable.should.equal(false)
    })
  })

  describe('get user data tests', () => {
    const userID = 'get-user'

    it('should update the user data if a matching user record is found', () => {
      let getStub = sandbox.stub(DB.prototype, 'get')
      getStub.resolves({ user_id: userID, loan_ids: [2, 4], request_ids: [1, 2, 3] })

      let testUser = new User(userID, 'UserCacheTable', 'eu-west-2')

      return testUser.getData().then(() => {
        testUser.user_id.should.equal(userID)
        testUser.loan_ids.should.deep.equal([2, 4])
        testUser.request_ids.should.deep.equal([1, 2, 3])
      })
    })

    it('should be rejected with an error if no matching user record is found', () => {
      let getStub = sandbox.stub(DB.prototype, 'get')
      getStub.rejects(new Error('No matching record found'))

      let testUser = new User(userID, 'UserCacheTable', 'eu-west-2')

      return testUser.getData()
        .should.eventually.be.rejectedWith('No matching record found')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    it('should be rejected with an error if dynamoDB throws an error', () => {
      let getStub = sandbox.stub(DB.prototype, 'get')
      getStub.rejects(new Error('DynamoDB failed'))

      let testUser = new User(userID, 'UserCacheTable', 'eu-west-2')

      return testUser.getData()
        .should.eventually.be.rejectedWith('DynamoDB failed')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    it('should make the record saveable if it succeeds', () => {
      let getStub = sandbox.stub(DB.prototype, 'get')
      getStub.resolves({})

      let testUser = new User(userID, 'UserCacheTable', 'eu-west-2')

      return testUser.getData().then(() => {
        testUser.saveable.should.equal(true)
      })
    })
  })

  describe('save method', () => {
    const userID = 'save-user'

    it('should be rejected with an error if it is not saveable', () => {
      let testUser = new User(userID, 'UserCacheTable', 'eu-west-2')
      testUser.saveable = false

      return testUser.save().should.eventually.be.rejectedWith('Record is not saveable')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    it('should be fulfilled if the record saves successfully', () => {
      let saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.resolves(true)

      let testUser = new User(userID, 'UserCacheTable', 'eu-west-2')
      testUser.saveable = true

      return testUser.save()
        .should.eventually.be.fulfilled
    })

    it('should be rejected with an error if the record does not save', () => {
      let saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.rejects(new Error('DynamoDB broke'))

      let testUser = new User(userID, 'UserCacheTable', 'eu-west-2')
      testUser.saveable = true

      return testUser.save()
        .should.eventually.be.rejectedWith('DynamoDB broke')
        .instanceOf(Error)
    })

    it('should be called with the correct parameters', () => {
      const expectedParams = {
        user_id: userID,
        loan_ids: [],
        request_ids: []
      }

      let saveStub = sandbox.stub(DB.prototype, 'save')
      let getStub = sandbox.stub(DB.prototype, 'get')
      saveStub.resolves(true)
      getStub.resolves({ request_ids: [], loan_ids: [] })

      let testUser = new User(userID, 'UserCacheTable', 'eu-west-2')

      return testUser.getData().then(() => {
        return testUser.save().then(() => {
          saveStub.should.have.been.calledWith(expectedParams)
        })
      })
    })
  })

  describe('addLoan method', () => {
    const userID = 'addloan-user'
    let testUser = new User(userID, 'UserCacheTable', 'eu-west-2')

    it('should add the loan id if the array does not already contain it', () => {
      testUser.loan_ids = []
      testUser.loan_ids.should.not.include(2)
      testUser.addLoan(2)
      testUser.loan_ids.should.include(2)
    })

    it('should not add the loan id if the array already contain it', () => {
      testUser.loan_ids = [2]
      testUser.loan_ids.should.deep.equal([2])
      testUser.addLoan(2)
      testUser.loan_ids.should.deep.equal([2])
    })
  })
})
