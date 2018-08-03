const moment = require('moment')

module.exports = function (ID) {
  return this.get(ID)
    .then(user => {
      return (user && user.expiry_date >= moment().unix())
        ? user
        : null
    })
}
