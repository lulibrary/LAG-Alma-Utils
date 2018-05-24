const dynamoose = require('dynamoose')
const moment = require('moment')
const _chunk = require('lodash.chunk')

const batchGetLimit = 25

dynamoose.setDefaults({
  create: false,
  waitForActiveTimeout: 5000
})

const Schema = dynamoose.Schema

const expiryOffset = {
  value: 2,
  unit: 'hours'
}

const calculateExpiry = (offset) => {
  return moment().add(offset.value, offset.unit).unix()
}

const userSchema = new Schema({
  primary_id: {
    type: String,
    hashKey: true
  },
  loan_ids: [String],
  request_ids: [String],
  expiry_date: {
    type: Number,
    default: (model) => calculateExpiry(expiryOffset)
  }
}, {})

userSchema.methods = {
  getData: function (model, source, destination, tableKey) {
    const batches = _chunk(source, batchGetLimit)
    let promises = []

    batches.forEach((batch) => {
      const batchKeys = batch.map((id) => {
        let getMethodKey = {}
        getMethodKey[tableKey] = id
        return getMethodKey
      })
      promises.push(model.batchGet(batchKeys)
        .then(data => {
          Array.prototype.push.apply(destination, data)
        }))
    })

    return Promise.all(promises).then(() => destination)
  },

  getLoanData: function (loanModel) {
    this.loans = []
    return this.getData(loanModel, this.loan_ids, this.loans, 'loan_id')
  },

  getRequestData: function (requestModel) {
    this.requests = []
    return this.getData(requestModel, this.request_ids, this.requests, 'request_id')
  },

  addLoan: function (loanID) {
    return this.add('loan_ids', loanID)
  },

  addRequest: function (requestID) {
    return this.add('request_ids', requestID)
  },

  add: function (field, value) {
    if (!this[field].includes(value)) {
      this[field].push(value)
    }
    return this
  }
}

module.exports = (userTable) => {
  if (userTable.region) {
    dynamoose.AWS.config.update({
      region: userTable.region
    })
  }

  let model = dynamoose.model(userTable.name, userSchema)

  return model
}
