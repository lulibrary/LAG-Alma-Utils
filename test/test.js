const chai = require('chai')
chai.should()

// Module under test
const Utils = require('../src')

describe('index tests', () => {
  it('should export an object', () => {
    Utils.should.be.an('object')
  })
})
