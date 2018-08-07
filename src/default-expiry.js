const moment = require('moment')

module.exports = {
  type: Number,
  default: () => moment().add(2, 'weeks').unix()
}
