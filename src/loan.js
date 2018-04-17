// const AWS = require('aws-sdk');
const _pick = require('lodash.pick')
const moment = require('moment')
const _merge = require('lodash.merge')
const DB = require('./db.js')

const fields = [
  'loan_id',
  'user_id',
  'renewable',
  'call_number',
  'loan_status',
  'due_date',
  'item_barcode',
  'mms_id',
  'title',
  'author',
  'description',
  'publication_year',
  'process_status'
]

class Loan {
  constructor (loan_id, loanCacheTable) {
    this.loan_id = loan_id
    this.loanCacheTable = loanCacheTable
    this.loanData = {
      loan_id
    }
    this.db = new DB({
      loanCacheTable
    })
  }

  populate (loanData) {
    this.loanData = _merge(this.loanData, _pick(loanData, fields))
    return this
  }

  addExpiryDate (expiry_field = 'due_date') {
    if (this.loanData[expiry_field]) {
      this.loanData.expiry_date = moment(this.loanData[expiry_field]).unix()
    }
    return this
  }

  save () {
    return this.db.saveLoan(this.loanData)
  }
}

module.exports = Loan
