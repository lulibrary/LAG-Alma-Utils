const dynamoose = require('dynamoose')
const moment = require('moment')

dynamoose.setDefaults({
  create: false,
  waitForActiveTimeout: 5000
})

const Schema = dynamoose.Schema

const calculateExpiry = (dueDate) => {
  if (dueDate) {
    return moment(dueDate, 'YYYY-MM-DDTHH:MM:SSZ').unix()
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
    default: (model) => calculateExpiry(model.due_date)
  },
  item_barcode: String,
  mms_id: String,
  title: String,
  author: String,
  description: String,
  publication_year: String,
  process_status: String
}, {})

module.exports = (tableName, region) => {
  if (region) {
    dynamoose.AWS.config.update({
      region
    })
  }
  return dynamoose.model(tableName, loanSchema)
}
