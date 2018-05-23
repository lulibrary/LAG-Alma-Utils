const AWS_MOCK = require('aws-sdk-mock')

const sinon = require('sinon')
const sandbox = sinon.sandbox.create()

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
chai.should()

const rewire = require('rewire')

// Module under test
const LoanSchema = rewire('../src/loan-schema')

describe('loan schema tests', function () {
  describe('calculate expiry tests', () => {
    const calculateExpiry = LoanSchema.__get__('calculateExpiry')

    it('should return 0 for the unix epoch', () => {
      calculateExpiry('1970-01-01T00:00:00Z').should.equal(0)
    })

    it('should return 0 if no value is passed', () => {
      let model = {}
      calculateExpiry(model.due_date).should.equal(0)
    })

    it('should return a time in seconds', () => {
      calculateExpiry('1970-01-01T00:00:01Z').should.equal(1)
    })
  })

  describe('model tests', () => {
    it('should set the expiry date if the due date is set', () => {
      const TestLoanModel = LoanSchema('loantable', 'region')
      const putStub = sandbox.stub()
      putStub.callsArgWith(1, null, true)
      AWS_MOCK.mock('DynamoDB', 'putItem', putStub)

      AWS_MOCK.mock('DynamoDB', 'describeTable', true)

      let testLoan = new TestLoanModel({
        loan_id: 'a loan',
        due_date: '1970-01-01T00:00:00Z',
        test: 'test'
      })

      testLoan.save()

      testLoan.expiry_date.should.equal(0)
    })
  })
})
