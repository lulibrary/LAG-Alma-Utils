const AWS_MOCK = require('aws-sdk-mock')
const sinon = require('sinon')

const chai = require('chai')
const should = chai.should()
const chai_as_promised = require('chai-as-promised')
const sinon_chai = require('sinon-chai')
chai.use(chai_as_promised)
chai.use(sinon_chai)

const User = require('../src/user')

const CacheError = require('../cache-error')

describe('user class tests', () => {
  describe('constructor tests', () => {
    it('should create a user that is not saveable', () => {
      let testUser = new User('construct-user', 'UserCacheTable')
      testUser.saveable.should.equal(false)
    })
  })  

  describe('get user data tests', () => {
    const user_id = 'get-user';

    afterEach(() => {
      AWS_MOCK.restore('DynamoDB.DocumentClient', 'get')
    })

    it('should update the user data if a matching user record is found', () => {
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', { Item: { user_id, loan_ids: [2, 4], request_ids: [1, 2, 3] } })
      let testUser = new User(user_id, 'UserCacheTable')

      return testUser.getData().then(() => {
        testUser.user_id.should.equal(user_id)
        testUser.loan_ids.should.deep.equal([2, 4])
        testUser.request_ids.should.deep.equal([1, 2, 3])
      })
    })

    it('should be rejected with an error if no matching user record is found', () => {
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', {})
      let testUser = new User(user_id, 'UserCacheTable')

      return testUser.getData()
        .should.eventually.be.rejectedWith('No matching record found')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    
  
    it('should be rejected with an error if dynamoDB throws an error', () => {
      let dynamoGetStub = sinon.stub()
      dynamoGetStub.callsArgWith(1, new Error('DynamoDB failed'), null)
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', dynamoGetStub)

      let testUser = new User(user_id, 'UserCacheTable')

      return testUser.getData()
        .should.eventually.be.rejectedWith('DynamoDB failed')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    it('should make the record saveable if it succeeds', () => {
      let dynamoGetStub = sinon.stub()
      dynamoGetStub.callsArgWith(1, null, { Item: {}})
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', dynamoGetStub)

      let testUser = new User(user_id, 'UserCacheTable')

      return testUser.getData().then(() => {
        testUser.saveable.should.equal(true)
      })
    })
  })


  describe('save method', () => {
    const user_id = 'save-user';

    afterEach(() => {
      AWS_MOCK.restore('DynamoDB.DocumentClient', 'put')
    })

    it('should be rejected with an error if it is not saveable', () => {
      let testUser = new User(user_id, 'UserCacheTable')
      testUser.saveable = false

      return testUser.save().should.eventually.be.rejectedWith('Record is not saveable')
        .and.should.eventually.be.an.instanceOf(CacheError)
    })

    it('should be fulfilled with true if the record saves successfully', () => {
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'put', true)
      let testUser = new User(user_id, 'UserCacheTable')
      testUser.saveable = true

      return testUser.save()
        .should.eventually.be.fulfilled
    })

    it('should be rejected with an error if the record does not save', () => {
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'put', (p, cb) => cb(new Error('DynamoDB broke'), null))
      let testUser = new User(user_id, 'UserCacheTable')
      testUser.saveable = true

      return testUser.save()
        .should.eventually.be.rejectedWith('DynamoDB broke')
        .instanceOf(Error)
    })

    it('should be called with the correct parameters', () => {
      const expectedParams = {
        Item: {
          user_id,
          loan_ids: [],
          request_ids: []
        },
        TableName: 'UserCacheTable'
      }

      let saveStub = sinon.stub()
      saveStub.callsArgWith(1, null, true)
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', { Item: { request_ids: [], loan_ids: [] } })
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'put', saveStub)

      let testUser = new User(user_id, 'UserCacheTable')

      return testUser.getData().then(() => {
        testUser.save().then(() => {
          saveStub.should.have.been.calledWith(expectedParams)
        })
      })

      after(() => {
        AWS_MOCK.restore('DynamoDB.DocumentClient', 'get')
      })
    })
  })

  describe('addLoan method', () => {
    const user_id = 'addloan-user'
    let testUser = new User(user_id, 'UserCacheTable')

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
