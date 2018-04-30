const _pick = require('lodash.pick')
const _merge = require('lodash.merge')
const moment = require('moment')
const DB = require('@lulibrary/lag-utils').DB

class Item {
  constructor (data) {
    this.type = data.type
    this.key = data.key
    this.id = data.id

    this.tableName = data.tableName
    this.db = new DB(data.tableName, data.region)
    this.data = {}

    this.data[data.key] = data.id
  }

  populate (data) {
    this.data = _merge(this.data, _pick(data, this.constructor.fields))
    return this
  }

  addExpiryDate (expiryField) {
    if (this.data[expiryField]) {
      this.data.expiry_date = moment(this.data[expiryField]).unix()
    }
    return this
  }

  save () {
    return this.db.save(this.data)
  }

  delete () {
    let Key = {}
    Key[this.key] = this.id
    return this.db.delete(Key)
  }
}

Item.fields = []

module.exports = Item
