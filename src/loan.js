const _merge = require('lodash.merge')
const Item = require('./item')

let baseData = {
  key: 'loan_id',
  type: 'loan'
}

class LoanItem extends Item {
  constructor (params) {
    let data = _merge(params, baseData)

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
