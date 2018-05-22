const dynamoose = require('dynamoose')

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
  user_primary_id: String,
  request_type: String,
  request_sub_type: {
    value: String,
    desc: String
  },
  request_status: String,
  pickup_location: String,
  pickup_location_type: String,
  pickup_location_library: String,
  material_type: {
    value: String,
    desc: String
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
  process_status: String
}, {})

module.exports = (tableName, region) => {
  if (region) {
    dynamoose.AWS.config.update({
      region
    })
  }
  return dynamoose.model(tableName, requestSchema)
}
