const chai = require('chai')
chai.should()

// Test data
const RequestSchema = require('../src/request-schema')
const LoanSchema = require('../src/loan-schema')
const FeeSchema = require('../src/fee-schema')
const UserSchema = require('../src/user-schema')
const QueuedUserSchema = require('../src/queued-user-schema')

// Module under test
const Utils = require('../src')

describe('index tests', () => {
  it('should export an object', () => {
    Utils.should.be.an('object')
  })

  it('should export a RequestSchema object matching the one exported by request-schema.js', () => {
    Utils.RequestSchema.should.deep.equal(RequestSchema)
  })

  it('should export a LoanSchema object matching the one exported by loan-schema.js', () => {
    Utils.LoanSchema.should.deep.equal(LoanSchema)
  })

  it('should export a FeeSchema object matching the one exported by fee-schema.js', () => {
    Utils.FeeSchema.should.deep.equal(FeeSchema)
  })

  it('should export a UserSchema object matching the one exported by user-schema.js', () => {
    Utils.UserSchema.should.deep.equal(UserSchema)
  })

  it('should export a QueuedUserSchema object matching the one exported by queued-user-schema.js', () => {
    Utils.QueuedUserSchema.should.deep.equal(QueuedUserSchema)
  })
})
