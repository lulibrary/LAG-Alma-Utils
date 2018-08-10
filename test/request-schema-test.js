const AWS = require('aws-sdk')
const docClient = new AWS.DynamoDB.DocumentClient({ endpoint: 'http://127.0.0.1:8000', region: 'eu-west-2' })
const dynamo = new AWS.DynamoDB({ endpoint: 'http://127.0.0.1:8000', region: 'eu-west-2' })

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const dynamoose = require('dynamoose')
dynamoose.AWS.config.update({
  region: 'eu-west-2'
})
dynamoose.local()

const chai = require('chai')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
chai.should()

const Model = require('dynamoose/lib/Model')

const DynamoLocal = require('dynamodb-local')
const DynamoLocalPort = 8000

const rewire = require('rewire')
let wires = []

// Module under test
const RequestSchema = rewire('../src/request-schema')
const TestRequestModel = RequestSchema('requestTable')

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

  afterEach(() => {
    sandbox.restore()
    wires.forEach(wire => wire())
    wires = []
  })

  it('should export a function', () => {
    (typeof RequestSchema).should.equal('function')
  })

  describe('model function tests', () => {
    let TestRequestModel1 = RequestSchema('requestTable')

    it('should return a dynamoose model', () => {
      const testRequest = new TestRequestModel1({
        request_id: 'a request'
      })
      testRequest.should.be.an.instanceOf(Model)
    })
  })

  describe('schema tests', () => {
    it('should accept all desired parameters with correct types', function () {
      const dateStub = sandbox.stub(Date, 'now')
      dateStub.returns(0)

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
            data.Item.should.deep.equal(Object.assign(testRequestData, { record_expiry_date: 2 * 7 * 24 * 60 * 60 }))
          })
        })
    })

    it('should remove parameters not in the schema', () => {
      const dateStub = sandbox.stub(Date, 'now')
      dateStub.returns(0)

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
            data.Item.should.deep.equal({
              request_id: testID,
              record_expiry_date: 2 * 7 * 24 * 60 * 60
            })
          })
        })
    })
  })

  describe('getValid method tests', () => {
    it('should call the getValid module method with the provided ID and the correct expiry field name', () => {
      const correctExpiryField = 'record_expiry_date'
      const testRequestId = uuid()

      const getValidStub = sandbox.stub()
      getValidStub.resolves()
      wires.push(
        RequestSchema.__set__('getValid', getValidStub)
      )

      return TestRequestModel.getValid(testRequestId)
        .then(() => {
          getValidStub.should.have.been.calledWith(testRequestId, correctExpiryField)
        })
    })

    it('should call the getValid method with the correct `this` context', () => {
      const testRequestId = uuid()

      const getValidStub = sandbox.stub()
      getValidStub.resolves()
      wires.push(
        RequestSchema.__set__('getValid', getValidStub)
      )

      return TestRequestModel.getValid(testRequestId)
        .then(() => {
          getValidStub.should.have.been.calledOn(TestRequestModel)
        })
    })
  })
})
