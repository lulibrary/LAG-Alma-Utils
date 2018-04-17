const AWS = require('aws-sdk')

const DB = require('./db')
const CacheError = require('./cache-error')
// const userGet = require('./get-user-data')
// const getUserData = userGet.getUserData

class User {
  constructor (user_id, userCacheTable) {
    this.user_id = user_id
    // this.docClient = new AWS.DynamoDB.DocumentClient();
    // this.userCacheTable = userCacheTable;
    this.loan_ids = []
    this.request_ids = []
    this.saveable = false
    this.db = new DB({ userCacheTable })
  }

  getData () {
    return new Promise((resolve, reject) => {
      this.db.getUser(this.user_id).then((userData) => {
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

      return this.db.saveUser(userData)
    } else {
      return Promise.reject(new CacheError('Record is not saveable'))
    }
  }

  addLoan (loan_id) {
    if (!this.loan_ids.includes(loan_id)) {
      this.loan_ids.push(loan_id)
    }
    return this
  }

  addRequest (request_id) {

  }
}

module.exports = User
