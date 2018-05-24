const AWS = require('aws-sdk')
const docClient = new AWS.DynamoDB.DocumentClient({ endpoint: 'http://127.0.0.1:8000', region: 'eu-west-2' })
const dynamo = new AWS.DynamoDB({ endpoint: 'http://127.0.0.1:8000', region: 'eu-west-2' })

const dynamoose = require('dynamoose')
dynamoose.local()

const chai = require('chai')
chai.should()

const Model = require('dynamoose/lib/Model')

const DynamoLocal = require('dynamodb-local')
const DynamoLocalPort = 8000

// Module under test
const RequestSchema = require('../src/request-schema')
RequestSchema.updateRegion('eu-west-2')
const TestRequestModel = RequestSchema.model('requestTable')

const uuid = require('uuid/v4')

describe('request schema tests', function () {
  this.timeout(5000)
  before(function () {
    this.timeout(25000)
    process.env.AWS_ACCESS_KEY_ID = 'key'
    process.env.AWS_SECRET_ACCESS_KEY = 'key2'
    return require('./dynamodb-local')('requestTable', 'request_id')
      .then(() => {
        return dynamo.listTables().promise().then((data) => {
          console.log('Tables:', data.TableNames)
        })
      })
  })

  after(() => {
    console.log('Tests complete')
    delete process.env.AWS_ACCESS_KEY_ID
    delete process.env.AWS_SECRET_ACCESS_KEY
    DynamoLocal.stop(DynamoLocalPort)
  })

  it('should export an object', () => {
    (typeof RequestSchema).should.equal('object')
  })

  describe('model function tests', () => {
    let TestRequestModel1 = RequestSchema.model('requestTable')

    it('should return a dynamoose model', () => {
      const testRequest = new TestRequestModel1({
        request_id: 'a request'
      })
      testRequest.should.be.an.instanceOf(Model)
    })
  })

  describe('update region function tests', () => {
    it('should update the region in the AWS config', () => {
      dynamoose.AWS.config.region = ''
      RequestSchema.updateRegion('eu-west-2')
      dynamoose.AWS.config.region.should.equal('eu-west-2')
    })
  })

  describe('schema tests', () => {
    it('should accept all desired parameters with correct types', function () {
      const testID = `${uuid()}`
      const testRequestData = {
        request_id: testID,
        user_primary_id: 'a user',
        request_type: 'a type',
        request_sub_type: {
          value: 'a sub type',
          desc: 'a description'
        },
        request_status: 'a status',
        pickup_location: 'a location',
        pickup_location_type: 'a location type',
        pickup_location_library: 'a library',
        material_type: {
          value: 'a material',
          desc: 'a description'
        },
        comment: 'a comment',
        place_in_queue: 'a place',
        request_date: 'a date',
        expiry_date: 'a date',
        barcode: 'a barcode',
        mms_id: 'an id',
        title: 'a book',
        author: 'a person',
        description: 'a description',
        resource_sharing: 'a thing',
        process_status: 'a status'
      }

      return new Promise((resolve, reject) => {
        TestRequestModel.create(testRequestData, (err, data) => {
          err ? reject(err) : resolve(data)
        })
      })
        .then(() => {
          return docClient.get({
            Key: { request_id: testID },
            TableName: 'requestTable'
          }).promise().then((data) => {
            data.Item.should.deep.equal(testRequestData)
          })
        })
    })

    it('should remove parameters not in the schema', () => {
      const testID = `${uuid()}`
      const testRequestData = {
        request_id: testID,
        bad_param: 'danger'
      }

      return new Promise((resolve, reject) => {
        TestRequestModel.create(testRequestData, (err, data) => {
          err ? reject(err) : resolve(data)
        })
      })
        .then(() => {
          return docClient.get({
            Key: { request_id: testID },
            TableName: 'requestTable'
          }).promise().then((data) => {
            data.Item.should.deep.equal({ request_id: testID })
          })
        })
    })
  })
})
