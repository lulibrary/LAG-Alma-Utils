const dynamoose = require('dynamoose')
const moment = require('moment')
const _chunk = require('lodash.chunk')

const DYNAMO_DB_BATCH_GET_LIMIT = 25

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
  loan_ids: {
    type: 'list',
    list: [String]
  },
  request_ids: {
    type: 'list',
    list: [String]
  },
  expiry_date: {
    type: Number,
    default: (model) => calculateExpiry(expiryOffset)
  }
}, {
  useDocumentTypes: true
})

userSchema.methods = {
  populateArrayFromModel: function (model, sourceKeys, modelTableKey) {
    const sourceKeyBatches = _chunk(sourceKeys, DYNAMO_DB_BATCH_GET_LIMIT)
    let resolvingPromises = []
    let retrievedData = []

    sourceKeyBatches.forEach((batch) => {
      // Create an array of DynamoDB key objects
      const batchGetKeys = batch.map((id) => {
        let dynamoKeyObject = {}
        dynamoKeyObject[modelTableKey] = id
        return dynamoKeyObject
      })
      // Execute batchGet request
      resolvingPromises.push(model.batchGet(batchGetKeys)
        .then(data => {
          retrievedData = retrievedData.concat(data)
        }))
    })

    return Promise.all(resolvingPromises).then(() => retrievedData)
  },

  populateLoans: function (loanModel) {
    return this.populateArrayFromModel(loanModel, this.loan_ids, 'loan_id')
      .then((loanData) => {
        this.loans = loanData
      })
  },

  populateRequests: function (requestModel) {
    return this.populateArrayFromModel(requestModel, this.request_ids, 'request_id')
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
