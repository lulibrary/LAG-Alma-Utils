const dynamoose = require('dynamoose')

const getValid = require('./get-valid')
const calculateExpiry = require('./calculate-expiry')

dynamoose.setDefaults({
  create: false,
  waitForActiveTimeout: 5000
})

const Schema = dynamoose.Schema

const expiryOffset = {
  value: 5,
  unit: 'minutes'
}

const queuedUserSchema = new Schema({
  primary_id: {
    type: String,
    hashKey: true
  },
  expiry_date: {
    type: Number,
    default: () => calculateExpiry(expiryOffset)
  }
})

queuedUserSchema.statics.getValid = getValid

module.exports = (userTable) => dynamoose.model(userTable, queuedUserSchema)
