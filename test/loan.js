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
const Loan = require('../src/loan-item')

describe('loan-item class tests', () => {
  afterEach(() => {
    sandbox.restore()
  })

  describe('constructor tests', () => {
    it('should populate the instance with the expected parameters', () => {
      let testLoan = new Loan('test', 'cachetable')
      testLoan.id.should.equal('test')
      testLoan.tableName.should.equal('cachetable')
      testLoan.data.should.deep.equal({ loan_id: 'test' })
    })
  })

  describe('populate method tests', () => {
    it('should remove unwanted fields in the loan data', () => {
      const data = {
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
      testLoan.data.should.deep.equal({loan_id: 'a loan'})
      testLoan.populate(data)
      testLoan.data.should.deep.equal({loan_id: 'a loan'})
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
      testLoan.data.should.deep.equal({loan_id: 'a loan'})
      testLoan.populate(input)
      testLoan.data.should.deep.equal(expected)
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
      testLoan.data.should.deep.equal({loan_id: 'a loan'})
      testLoan.populate(input1)
      testLoan.data.should.deep.equal(expected1)
      testLoan.populate(input2)
      testLoan.data.should.deep.equal(expected2)
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
      testLoan.data.should.deep.equal({loan_id: 'a loan'})
      testLoan.populate(input1)
      testLoan.data.should.deep.equal(expected1)
      testLoan.populate(input2)
      testLoan.data.should.deep.equal(expected2)
    })
  })

  describe('add expiry date method tests', () => {
    it('should add the correct expiry date for the due date', () => {
      const testLoan = new Loan('a loan', 'LoanCacheTable')
        .populate({due_date: '2018-02-23T14:10:06Z'})
        .addExpiryDate('due_date')
      testLoan.data.expiry_date.should.equal(1519395006)
    })

    it('should not add an expiry date if the expiry field is not set', () => {
      const testLoan = new Loan('a loan', 'LoanCacheTable')
        .addExpiryDate('due_date')
      testLoan.data.should.not.have.property('expiry_date')
    })
  })

  describe('save method tests', () => {
    it('should call the database save method with the loan data', () => {
      const saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.resolves(true)

      const testLoan = new Loan('a loan', 'loan cache table')

      return testLoan.save().then(() => {
        saveStub.should.have.been.calledWith(testLoan.data)
      })
    })

    it('should be fulfilled if DB#save resolves', () => {
      const saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.resolves(true)

      const testLoan = new Loan('a loan', 'loan cache table')

      return testLoan.save().should.eventually.be.fulfilled
    })

    it('should be rejected if DB#save is rejected', () => {
      const saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.rejects(new Error('Database error'))

      const testLoan = new Loan('a loan', 'loan cache table')

      return testLoan.save().should.eventually.be.rejectedWith('Database error')
        .and.should.eventually.be.an.instanceOf(Error)
    })
  })

  describe('delete method tests', () => {
    it('should call DB#delete with the correct key', () => {
      const deleteStub = sandbox.stub(DB.prototype, 'delete')
      deleteStub.resolves(true)

      const testLoan = new Loan('a loan', 'loan cache table')

      return testLoan.delete().then(() => {
        deleteStub.should.have.been.calledWith({ loan_id: 'a loan' })
      })
    })

    it('should be fulfilled if DB#delete resolves', () => {
      const deleteStub = sandbox.stub(DB.prototype, 'delete')
      deleteStub.resolves(true)

      const testLoan = new Loan('a loan', 'loan cache table')

      return testLoan.delete().should.eventually.be.fulfilled
    })

    it('should be rejected if DB#delete is rejected', () => {
      const deleteStub = sandbox.stub(DB.prototype, 'delete')
      deleteStub.rejects(new Error('Database error'))

      const testLoan = new Loan('a loan', 'loan cache table')

      return testLoan.delete().should.eventually.be.rejectedWith('Database error')
        .and.should.eventually.be.an.instanceOf(Error)
    })
  })
})
