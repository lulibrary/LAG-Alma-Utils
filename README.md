# LAG-Alma-Utils
A nodeJS package for Alma item schemas in DynamoDB, using [dynamoose](https://github.com/dynamoosejs/dynamoose)

This package provides schemas for Users, Loans, Requests and Fees

All schemas set record expiries for DynamoDB TTL on the field `expiry_date`, except for the Request schema, where it is `record_expiry_date`, for which Alma request data includes a field named `expiry_date`.

## User Schema
The hash key for this schema is `user_id`, and the expiry date defaults to two hours from the last update of the record.

## Loan Schema
The hash key for this schema is `loan_id`, and the expiry date defaults to the loan's `due_date` field, converted to a unix timestamp.

## Request Schema
The hash key for this schema is `request_id`, and the expiry date defaults to two weeks from the the last update of the record

## Fee Schema
The hash key for this schema is `id`, and the expiry date defaults to two weeks from the the last update of the record

All schemas include a `model.getValid(hashKey)` method which will only return a record if the expiry date is not yet passed.

## Usage

`npm installgit+ssh://git@github.com/lulibrary/LAG-Alma-Utils.git#master`
```javascript
const { UserSchema, LoanSchema } = require('@lulibrary/lag-alma-utils')

const UserModel = UserSchema('my_user_table')
UserModel.create({
    user_id: 'my_user'
})

UserModel.delete('my_user')
```

## Associated Services

There are four services that make up the Alma caching stack. These are:

- [alma-webhook-handler](https://github.com/lulibrary/alma-webhook-handler)       -   passes Alma webhook data to SNS topics :
- [LAG-sns-update-cache](https://github.com/lulibrary/LAG-sns-update-cache)       -   writes webhook data from SNS topics to  DynanoDB
- [LAG-bulk-update-cache](https://github.com/lulibrary/LAG-bulk-update-cache)     -   updates DynamoDB with data from Alma API for queued records
- [LAG-api-gateway](https://github.com/lulibrary/LAG-api-gateway)                 -   provides a REST API for cached Alma data with fallback to Alma API

There are also 3 custom packages on which these depend. These are:
- [LAG-Utils](https://github.com/lulibrary/LAG-Utils)                             -   utility library for AWS services
- [LAG-Alma-Utils](https://github.com/lulibrary/LAG-Alma-Utils)                   -   utility library for DynamoDB cache schemas
- [node-alma-api-wrapper](https://github.com/lulibrary/node-alma-api-wrapper)     -   utility library for querying Alma API


## Development
Contributions to this service or any of the associated services and packages are welcome.
