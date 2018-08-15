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
  type: {
    type: 'map',
    map: {
      value: String,
      desc: String
    }
  },
  status: {
    type: 'map',
    map: {
      value: String,
      desc: String
    }
  },
  user_primary_id: {
    type: 'map',
    map: {
      value: {
        type: String,
        lowercase: true
      },
      link: String
    }
  },
  balance: Number,
  remaining_vat_amount: Number,
  original_amount: Number,
  original_vat_amount: Number,
  creation_time: String,
  status_time: String,
  comment: String,
  owner: {
    type: 'map',
    map: {
      value: String,
      desc: String
    }
  },
  title: String,
  barcode: String,
  link: String,
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
