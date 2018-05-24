const chai = require('chai')
chai.should()

// Test data
const Request = require('../src/request')
const RequestSchema = require('../src/request-schema')
const LoanSchema = require('../src/loan-schema')

// Module under test
const Utils = require('../src')

describe('index tests', () => {
  it('should export an object', () => {
    Utils.should.be.an('object')
  })

  it('should export a Request object matching the one exported by request.js', () => {
    Utils.Request.should.deep.equal(Request)
  })

  it('should export a RequestSchema object matching the one exported by request-schema.js', () => {
    Utils.RequestSchema.should.deep.equal(RequestSchema)
  })

  it('should export a LoanSchema object matching the one exported by loan-schema.js', () => {
    Utils.LoanSchema.should.deep.equal(LoanSchema)
  })
})
