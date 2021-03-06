const dynamoose = require('dynamoose')

const getValid = require('./get-valid')
const defaultExpiry = require('./default-expiry')

dynamoose.setDefaults({
  create: false,
  waitForActiveTimeout: 5000
})

const Schema = dynamoose.Schema

const requestSchema = new Schema({
  request_id: {
    type: String,
    hashKey: true
  },
  user_primary_id: {
    type: String,
    lowercase: true
  },
  request_type: String,
  request_sub_type: {
    type: 'map',
    map: {
      value: String,
      desc: String
    }
  },
  request_status: String,
  pickup_location: String,
  pickup_location_type: String,
  pickup_location_library: String,
  material_type: {
    type: 'map',
    map: {
      value: String,
      desc: String
    }
  },
  comment: String,
  place_in_queue: String,
  request_date: String,
  expiry_date: String,
  barcode: String,
  mms_id: String,
  title: String,
  author: String,
  description: String,
  resource_sharing: String,
  process_status: String,
  record_expiry_date: defaultExpiry
}, {
  useDocumentTypes: true
})

requestSchema.statics.getValid = function (requestID) {
  return getValid.call(this, requestID, 'record_expiry_date')
}

module.exports = (tableName) => dynamoose.model(tableName, requestSchema)
