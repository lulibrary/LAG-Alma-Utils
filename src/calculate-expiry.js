const moment = require('moment')

module.exports = (offset) => {
  return moment().add(offset.value, offset.unit).unix()
}
