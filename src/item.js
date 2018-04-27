const _pick = require('lodash.pick')
const _merge = require('lodash.merge')
const moment = require('moment')
const DB = require('@lulibrary/lag-utils').DB

class Item {
  constructor (data) {
    this.type = data.type
    this.id = data.id

    this.itemTable = data.itemTable
    this.db = new DB(data.itemTable, data.region)
    this.data = {}

    this.data[`${data.type}_id`] = data.id
  }

  populate (data) {
    this.data = _merge(this.data, _pick(data, this.fields))
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
    Key[`${this.type}_id`] = this.id
    return this.db.delete(Key)
  }
}

Item.fields = []

module.exports = Item
