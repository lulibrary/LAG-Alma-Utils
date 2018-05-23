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

const calculateExpiry = () => {
  return moment.add(expiryOffset.value, expiryOffset.unit).unix()
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
    default: (model) => calculateExpiry(model.due_date)
  }
}, {})

userSchema.methods = {
  addLoan: function (loanID) {
    if (!this.loan_ids.includes(loanID)) {
      this.loan_ids.push(loanID)
    }
  },

  getLoanData: function (loanModel) {
    this.loans = []

    const loanIdBatches = _chunk(this.loan_ids, batchGetLimit)
    let promises = []

    loanIdBatches.forEach((batch) => {
      const batchKeys = batch.map((loanID) => { return { loan_id: loanID } })
      promises.push(loanModel.batchGet(batchKeys).then(loans => {
        this.loans = this.loans.concat(loans)
      }))
    })

    return Promise.all(promises).then(() => this.loans)
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
