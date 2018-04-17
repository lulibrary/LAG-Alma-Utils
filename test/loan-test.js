const DB = require('@lulibrary/lag-utils').DB

const sinon = require('sinon')
const sandbox = sinon.sandbox.create()

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
chai.should()

// Module under test
const Loan = require('../src/loan')

describe('loan class tests', () => {
  afterEach(() => {
    sandbox.restore()
  })

  describe('constructor tests', () => {
    it('should populate the instance with the expected parameters', () => {
      let testLoan = new Loan('test', 'cachetable')
      testLoan.loan_id.should.equal('test')
      testLoan.loanCacheTable.should.equal('cachetable')
      testLoan.loanData.should.deep.equal({ loan_id: 'test' })
    })
  })

  describe('populate method tests', () => {
    it('should remove unwanted fields in the loan data', () => {
      const loanData = {
        param1: 'unwanted',
        param2: 'also unwanted',
        param3: {
          this: 'is',
          an: 'un',
          wanted: 'param'
        },
        param4: true,
        loan_id: 'a loan'
      }

      let testLoan = new Loan('a loan', 'a table')
      testLoan.loanData.should.deep.equal({loan_id: 'a loan'})
      testLoan.populate(loanData)
      testLoan.loanData.should.deep.equal({loan_id: 'a loan'})
    })

    it('should keep all wanted fields in the loan data', () => {
      const input = {
        loan_id: 'a loan',
        user_id: 'a user',
        renewable: true,
        call_number: 1,
        loan_status: 'LOAN_CREATED',
        due_date: '2018-02-23T14:10:06Z',
        item_barcode: 123456789,
        mms_id: 10,
        title: 'The hitchhikers guide to the galaxy',
        author: 'Douglas Adams',
        description: 42,
        publication_year: 1960,
        process_status: 'unknown',
        a_useless_param: {},
        another_useless_param: {
          thing: 'thing'
        }
      }

      const expected = {
        loan_id: 'a loan',
        user_id: 'a user',
        renewable: true,
        call_number: 1,
        loan_status: 'LOAN_CREATED',
        due_date: '2018-02-23T14:10:06Z',
        item_barcode: 123456789,
        mms_id: 10,
        title: 'The hitchhikers guide to the galaxy',
        author: 'Douglas Adams',
        description: 42,
        publication_year: 1960,
        process_status: 'unknown'
      }

      let testLoan = new Loan('a loan', 'a table')
      testLoan.loanData.should.deep.equal({loan_id: 'a loan'})
      testLoan.populate(input)
      testLoan.loanData.should.deep.equal(expected)
    })

    it('should overwrite existing fields if there a new values provided', () => {
      const input1 = {
        loan_id: 'a loan',
        user_id: 'a user',
        renewable: true
      }

      const expected1 = {
        loan_id: 'a loan',
        user_id: 'a user',
        renewable: true
      }

      const input2 = {
        loan_id: 'another loan',
        user_id: 'another user',
        renewable: false
      }

      const expected2 = {
        loan_id: 'another loan',
        user_id: 'another user',
        renewable: false
      }

      let testLoan = new Loan('a loan', 'a table')
      testLoan.loanData.should.deep.equal({loan_id: 'a loan'})
      testLoan.populate(input1)
      testLoan.loanData.should.deep.equal(expected1)
      testLoan.populate(input2)
      testLoan.loanData.should.deep.equal(expected2)
    })

    it('should not remove existing fields if no new value is provided', () => {
      const input1 = {
        loan_id: 'a loan',
        user_id: 'a user',
        renewable: true,
        title: 'a book'
      }

      const expected1 = {
        loan_id: 'a loan',
        user_id: 'a user',
        renewable: true,
        title: 'a book'
      }

      const input2 = {
        user_id: 'another user',
        renewable: false
      }

      const expected2 = {
        loan_id: 'a loan',
        user_id: 'another user',
        renewable: false,
        title: 'a book'
      }

      let testLoan = new Loan('a loan', 'a table')
      testLoan.loanData.should.deep.equal({loan_id: 'a loan'})
      testLoan.populate(input1)
      testLoan.loanData.should.deep.equal(expected1)
      testLoan.populate(input2)
      testLoan.loanData.should.deep.equal(expected2)
    })
  })

  describe('add expiry date method tests', () => {
    it('should add the correct expiry date for the due date', () => {
      const testLoan = new Loan('a loan', 'LoanCacheTable')
        .populate({due_date: '2018-02-23T14:10:06Z'})
        .addExpiryDate()
      testLoan.loanData.expiry_date.should.equal(1519395006)
    })

    it('should not add an expiry date if the expiry field is not set', () => {
      const testLoan = new Loan('a loan', 'LoanCacheTable')
        .addExpiryDate()
      testLoan.loanData.should.not.have.property('expiry_date')
    })
  })

  describe('save method tests', () => {
    it('should call the database save method with the loan data', () => {
      const saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.resolves(true)

      const testLoan = new Loan('a loan', 'loan cache table')

      testLoan.save(() => {
        saveStub.should.have.been.calledWith(testLoan.loanData)
      })
    })
  })
})
