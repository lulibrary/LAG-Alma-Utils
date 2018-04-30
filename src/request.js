// parent class
const Item = require('./item')

class Request extends Item {
  constructor (requestID, requestCacheTable, region) {
    let data = {
      id: requestID,
      tableName: requestCacheTable,
      region,
      key: 'request_id',
      type: 'request'
    }
    super(data)
  }
}

Request.fields = [
  'request_id',
  'user_primary_id',
  'request_type',
  'request_sub_type',
  'request_status',
  'pickup_location',
  'pickup_location_type',
  'pickup_location_library',
  'material_type',
  'comment',
  'place_in_queue',
  'request_date',
  'barcode',
  'mms_id',
  'title',
  'author',
  'description',
  'resource_sharing',
  'process_status'
]

module.exports = Request
