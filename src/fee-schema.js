const dynamoose = require('dynamoose')

const getValid = require('./get-valid')
const defaultExpiry = require('./default-expiry')

dynamoose.setDefaults({
  create: false,
  waitForActiveTimeout: 5000
})

const Schema = dynamoose.Schema

const feeSchema = new Schema({
  id: {
    type: String,
    hashKey: true
  },
  user_primary_id: String,
  type: String,
  status: String,
  balance: Number,
  remaining_vat_amount: Number,
  original_amount: Number,
  original_vat_amount: Number,
  creation_time: Number,
  status_time: Number,
  comment: String,
  owner: String,
  title: String,
  barcode: String,
  bursar_transaction_id: String,
  transactions: {
    type: 'list',
    list: [Object]
  },
  expiry_date: defaultExpiry
}, {
  useDocumentTypes: true
})

feeSchema.statics.getValid = getValid

module.exports = (tableName) => dynamoose.model(tableName, feeSchema)
