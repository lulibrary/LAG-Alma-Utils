const _pick = require('lodash.pick')
const moment = require('moment')
const _merge = require('lodash.merge')
const DB = require('@lulibrary/lag-utils').DB

const fields = [
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

class Request {
  constructor (requestID, requestCacheTable, region) {
    this.request_id = requestID
    this.requestCacheTable = requestCacheTable
    this.requestData = {
      request_id: requestID
    }
    this.db = new DB(requestCacheTable, region)
  }

  populate (requestData) {
    this.requestData = _merge(this.requestData, _pick(requestData, fields))
    return this
  }

  addExpiryDate (expiry_field = 'due_date') {
    if (this.requestData[expiry_field]) {
      this.requestData.expiry_date = moment(this.requestData[expiry_field]).unix()
    }
    return this
  }

  save () {
    return this.db.save(this.requestData)
  }

  delete () {
    return this.db.delete({ request_id: this.request_id })
  }
}

module.exports = Request
