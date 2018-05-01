const DB = require('@lulibrary/lag-utils').DB

class User {
  constructor (userID, userCacheTable, region) {
    this.user_id = userID
    this.loan_ids = []
    this.request_ids = []
    this.saveable = false
    this.db = new DB(userCacheTable, region)
  }

  getData () {
    return new Promise((resolve, reject) => {
      this.db.get({ user_id: this.user_id }).then((userData) => {
        this.loan_ids = userData.loan_ids
        this.request_ids = userData.request_ids
        this.saveable = true
        resolve(this)
      }).catch(e => {
        reject(e)
      })
    })
  }

  save () {
    if (this.saveable) {
      const userData = {
        user_id: this.user_id,
        loan_ids: this.loan_ids,
        request_ids: this.request_ids
      }

      return this.db.save(userData)
    } else {
      return Promise.reject(new Error('Record is not saveable'))
    }
  }

  addLoan (loanID) {
    return this.add('loan_ids', loanID)
  }

  addRequest (requestID) {
    return this.add('request_ids', requestID)
  }

  add (field, value) {
    if (!(this[field] instanceof Array)) {
      throw new Error(`Field ${field} is not an array`)
    } else {
      if (!this[field].includes(value)) {
        this[field].push(value)
      }
      return this
    }
  }
}

module.exports = User
