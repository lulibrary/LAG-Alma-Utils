const dynamoose = require('dynamoose')
const _chunk = require('lodash.chunk')

const getValid = require('./get-valid')

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

const calculateExpiry = require('./calculate-expiry')

const userSchema = new Schema({
  primary_id: {
    type: String,
    hashKey: true,
    lowercase: true
  },
  loan_ids: {
    type: 'list',
    list: [String],
    default: []
  },
  request_ids: {
    type: 'list',
    list: [String],
    default: []
  },
  fee_ids: {
    type: 'list',
    list: [String],
    default: []
  },
  expiry_date: {
    type: Number,
    default: (model) => calculateExpiry(expiryOffset)
  }
}, {
  useDocumentTypes: true
})

userSchema.statics.getValid = getValid

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

  addFee: function (feeID) {
    return this.add('fee_ids', feeID)
  },

  add: function (field, value) {
    if (!this[field].includes(value)) {
      this[field].push(value)
    }
    return this
  },

  deleteItem: function (field, value) {
    this[field] = this[field].filter(v => v !== value)
    return this
  },

  deleteLoan: function (loanID) {
    return this.deleteItem('loan_ids', loanID)
  },

  deleteRequest: function (requestID) {
    return this.deleteItem('request_ids', requestID)
  },

  deleteFee: function (feeID) {
    return this.deleteItem('fee_ids', feeID)
  }

}

module.exports = (userTable) => dynamoose.model(userTable, userSchema)
