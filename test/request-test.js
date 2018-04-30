const DB = require('@lulibrary/lag-utils').DB

const sinon = require('sinon')
const sandbox = sinon.sandbox.create()

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
chai.should()

// Module under test
const Request = require('../src/request')

describe('request class tests', () => {
  afterEach(() => {
    sandbox.restore()
  })

  describe('constructor tests', () => {
    it('should populate the instance with the expected parameters', () => {
      let testRequest = new Request({ id: 'test', tableName: 'cachetable', region: 'a region' })
      testRequest.id.should.equal('test')
      testRequest.tableName.should.equal('cachetable')
      testRequest.data.should.deep.equal({ request_id: 'test' })
    })
  })

  describe('populate method tests', () => {
    it('should remove unwanted fields in the request data', () => {
      const requestData = {
        param1: 'unwanted',
        param2: 'also unwanted',
        param3: {
          this: 'is',
          an: 'un',
          wanted: 'param'
        },
        param4: true,
        request_id: 'a request'
      }

      let testRequest = new Request({ id: 'a request', tableName: 'cachetable', region: 'a region' })
      testRequest.data.should.deep.equal({request_id: 'a request'})
      testRequest.populate(requestData)
      testRequest.data.should.deep.equal({request_id: 'a request'})
    })

    it('should keep all wanted fields in the loan data', () => {
      const input = {
        request_id: 'a request',
        user_primary_id: 'a user',
        request_type: 'a type',
        request_sub_type: 'a sub type',
        request_status: 'a status',
        pickup_location: 'a location',
        pickup_location_type: 'a location type',
        pickup_location_library: 'a library',
        material_type: 'a material type',
        comment: 'a comment',
        place_in_queue: 'a place in queue',
        request_date: 'a data',
        barcode: 'a barcode',
        mms_id: 'an mms id',
        title: 'a title',
        author: 'an author',
        description: 'a description',
        resource_sharing: 'an object',
        process_status: 'a status',
        a_useless_param: {},
        another_useless_param: {
          thing: 'thing'
        }
      }

      const expected = {
        request_id: 'a request',
        user_primary_id: 'a user',
        request_type: 'a type',
        request_sub_type: 'a sub type',
        request_status: 'a status',
        pickup_location: 'a location',
        pickup_location_type: 'a location type',
        pickup_location_library: 'a library',
        material_type: 'a material type',
        comment: 'a comment',
        place_in_queue: 'a place in queue',
        request_date: 'a data',
        barcode: 'a barcode',
        mms_id: 'an mms id',
        title: 'a title',
        author: 'an author',
        description: 'a description',
        resource_sharing: 'an object',
        process_status: 'a status'
      }

      let testRequest = new Request({ id: 'a request', tableName: 'cachetable', region: 'a region' })
      testRequest.data.should.deep.equal({ request_id: 'a request' })
      testRequest.populate(input)
      testRequest.data.should.deep.equal(expected)
    })

    it('should overwrite existing fields if there a new values provided', () => {
      const input1 = {
        request_id: 'a request',
        user_primary_id: 'a user'
      }

      const expected1 = {
        request_id: 'a request',
        user_primary_id: 'a user'
      }

      const input2 = {
        request_id: 'another request',
        user_primary_id: 'another user'
      }

      const expected2 = {
        request_id: 'another request',
        user_primary_id: 'another user'
      }

      let testRequest = new Request({ id: 'a request', tableName: 'cachetable', region: 'a region' })
      testRequest.data.should.deep.equal({request_id: 'a request'})
      testRequest.populate(input1)
      testRequest.data.should.deep.equal(expected1)
      testRequest.populate(input2)
      testRequest.data.should.deep.equal(expected2)
    })

    it('should not remove existing fields if no new value is provided', () => {
      const input1 = {
        request_id: 'a request',
        user_primary_id: 'a user',
        request_type: 'a type',
        title: 'a book'
      }

      const expected1 = {
        request_id: 'a request',
        user_primary_id: 'a user',
        request_type: 'a type',
        title: 'a book'
      }

      const input2 = {
        user_primary_id: 'another user',
        request_type: 'aanother type'
      }

      const expected2 = {
        request_id: 'a request',
        user_primary_id: 'another user',
        request_type: 'aanother type',
        title: 'a book'
      }

      let testRequest = new Request({ id: 'a request', tableName: 'cachetable', region: 'a region' })
      testRequest.data.should.deep.equal({request_id: 'a request'})
      testRequest.populate(input1)
      testRequest.data.should.deep.equal(expected1)
      testRequest.populate(input2)
      testRequest.data.should.deep.equal(expected2)
    })
  })

  describe('add expiry date method tests', () => {
    it('should add the correct expiry date for the request')

    it('should not add an expiry date if the expiry field is not set', () => {
      const testRequest = new Request({ id: 'a request', tableName: 'cachetable', region: 'a region' })
        .addExpiryDate()
      testRequest.data.should.not.have.property('expiry_date')
    })
  })

  describe('save method tests', () => {
    it('should call the database save method with the request data', () => {
      const saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.resolves(true)

      const testRequest = new Request({ id: 'a request', tableName: 'cachetable', region: 'a region' })

      return testRequest.save().then(() => {
        saveStub.should.have.been.calledWith(testRequest.data)
      })
    })

    it('should be fulfilled if DB#save resolves', () => {
      const saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.resolves(true)

      const testRequest = new Request({ id: 'a request', tableName: 'cachetable', region: 'a region' })

      return testRequest.save().should.eventually.be.fulfilled
    })

    it('should be rejected if DB#save is rejected', () => {
      const saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.rejects(new Error('Database error'))

      const testRequest = new Request({ id: 'a request', tableName: 'cachetable', region: 'a region' })

      return testRequest.save().should.eventually.be.rejectedWith('Database error')
        .and.should.eventually.be.an.instanceOf(Error)
    })
  })

  describe('delete method tests', () => {
    it('should call DB#delete with the correct key', () => {
      const deleteStub = sandbox.stub(DB.prototype, 'delete')
      deleteStub.resolves(true)

      const testRequest = new Request({ id: 'a request', tableName: 'cachetable', region: 'a region' })

      return testRequest.delete().then(() => {
        deleteStub.should.have.been.calledWith({ request_id: 'a request' })
      })
    })

    it('should be fulfilled if DB#delete resolves', () => {
      const deleteStub = sandbox.stub(DB.prototype, 'delete')
      deleteStub.resolves(true)

      const testRequest = new Request({ id: 'a request', tableName: 'cachetable', region: 'a region' })

      return testRequest.delete().should.eventually.be.fulfilled
    })

    it('should be rejected if DB#delete is rejected', () => {
      const deleteStub = sandbox.stub(DB.prototype, 'delete')
      deleteStub.rejects(new Error('Database error'))

      const testRequest = new Request({ id: 'a request', tableName: 'cachetable', region: 'a region' })

      return testRequest.delete().should.eventually.be.rejectedWith('Database error')
        .and.should.eventually.be.an.instanceOf(Error)
    })
  })
})
