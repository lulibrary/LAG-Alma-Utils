const Item = require('./item')

class LoanItem extends Item {
  constructor (loanID, loanCacheTable, region) {
    let data = {
      id: loanID,
      tableName: loanCacheTable,
      region,
      key: 'loan_id',
      type: 'loan'
    }
    super(data)
  }
}

LoanItem.fields = [
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

module.exports = LoanItem
