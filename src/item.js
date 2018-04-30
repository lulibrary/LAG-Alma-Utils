const _pick = require('lodash.pick')
const _merge = require('lodash.merge')
const moment = require('moment')
const DB = require('@lulibrary/lag-utils').DB

const requiredKeys = ['type', 'key', 'id', 'tableName', 'region']

class Item {
  constructor (data) {
    checkKeys(data)
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

const checkKeys = (dataObject) => {
  let dataKeys = Object.keys(dataObject)
  let missingKeys = []
  requiredKeys.forEach(key => {
    if (dataKeys.indexOf(key) === -1) {
      missingKeys.push(key)
    }
  })

  if (missingKeys.length !== 0) {
    throw new Error(`Constructor object requires key${missingKeys.length === 1 ? '' : 's'}: ${missingKeys.join(', ')}`)
  }
}

Item.fields = []

module.exports = Item
