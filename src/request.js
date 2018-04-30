const _pick = require('lodash.pick')
const moment = require('moment')
const _merge = require('lodash.merge')
const DB = require('@lulibrary/lag-utils').DB

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

  // populate (requestData) {
  //   this.data = _merge(this.data, _pick(requestData, fields))
  //   return this
  // }

  // addExpiryDate (expiry_field = 'due_date') {
  //   if (this.data[expiry_field]) {
  //     this.data.expiry_date = moment(this.data[expiry_field]).unix()
  //   }
  //   return this
  // }

  // save () {
  //   return this.db.save(this.data)
  // }

  // delete () {
  //   return this.db.delete({ request_id: this.request_id })
  // }
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
