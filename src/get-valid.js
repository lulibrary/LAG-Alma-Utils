const moment = require('moment')

module.exports = function (ID, expiryField = 'expiry_date') {
  return this.get(ID)
    .then(user => {
      return (user && user[expiryField] >= moment().unix())
        ? user
        : null
    })
}
