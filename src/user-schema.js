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
  getData: function (model, source, tableKey) {
    const batches = _chunk(source, batchGetLimit)
    let promises = []
    let retrievedData = []

    batches.forEach((batch) => {
      const batchKeys = batch.map((id) => {
        let getMethodKey = {}
        getMethodKey[tableKey] = id
        return getMethodKey
      })
      promises.push(model.batchGet(batchKeys)
        .then(data => {
          retrievedData = retrievedData.concat(data)
        }))
    })

    return Promise.all(promises).then(() => retrievedData)
  },

  getLoanData: function (loanModel) {
    return this.getData(loanModel, this.loan_ids, 'loan_id')
      .then((loanData) => {
        this.loans = loanData
      })
  },

  getRequestData: function (requestModel) {
    return this.getData(requestModel, this.request_ids, 'request_id')
      .then((requestData) => {
        this.requests = requestData
      })
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

module.exports = (userTable) => dynamoose.model(userTable, userSchema)
