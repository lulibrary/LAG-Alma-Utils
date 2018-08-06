const dynamoose = require('dynamoose')
const moment = require('moment')

const getValid = require('./get-valid')

dynamoose.setDefaults({
  create: false,
  waitForActiveTimeout: 5000
})

const Schema = dynamoose.Schema

const calculateExpiry = (dueDate) => {
  if (dueDate) {
    return moment(dueDate, 'YYYY-MM-DDTHH:mm:ssZ').unix()
  } else {
    return 0
  }
}

const loanSchema = new Schema({
  loan_id: {
    type: String,
    hashKey: true
  },
  user_id: String,
  renewable: Boolean,
  call_number: String,
  loan_status: String,
  due_date: String,
  expiry_date: {
    type: Number,
    default: function (model) {
      return calculateExpiry(model.due_date)
    }
  },
  item_barcode: String,
  mms_id: String,
  title: String,
  author: String,
  description: String,
  publication_year: String,
  process_status: String
}, {
  useDocumentTypes: true,
  useNativeBooleans: true
})

loanSchema.statics.getValid = getValid

module.exports = (tableName) => dynamoose.model(tableName, loanSchema)
