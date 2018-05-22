const chai = require('chai')
chai.should()

const Model = require('dynamoose/lib/Model')

// Module under test
const RequestSchema = require('../src/request-schema')

it('should export a function', () => {
  (typeof RequestSchema).should.equal('function')
})

it('should return a dynamoose model', () => {
  const TestRequestModel = RequestSchema('table', 'region')
  const testRequest = new TestRequestModel({
    request_id: 'a request'
  })
  testRequest.should.be.an.instanceOf(Model)
})
