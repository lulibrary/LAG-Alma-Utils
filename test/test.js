const chai = require('chai')
chai.should()

// Test data
const Request = require('../src/request')

// Module under test
const Utils = require('../src')

describe('index tests', () => {
  it('should export an object', () => {
    Utils.should.be.an('object')
  })

  it('should export a Request object matching the one exported by loan.js', () => {
    Utils.Request.should.deep.equal(Request)
  })
})
