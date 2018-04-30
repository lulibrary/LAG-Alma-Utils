const DB = require('@lulibrary/lag-utils').DB

const sinon = require('sinon')
const sandbox = sinon.sandbox.create()

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
const should = chai.should()
const expect = chai.expect

const rewire = require('rewire')

// Module under test
const Item = rewire('../src/item')

describe('item class tests', () => {
  afterEach(() => {
    sandbox.restore()
  })

  describe('constructor tests', () => {
    it('should populate the object with the supplied parameters', () => {
      const testData = {
        type: 'item-type',
        key: 'item_id',
        id: 'an item',
        tableName: 'a table',
        region: 'a region'
      }

      const testItem = new Item(testData)

      testItem.type.should.equal('item-type')
      testItem.key.should.equal('item_id')
      testItem.id.should.equal('an item')
      testItem.tableName.should.equal('a table')
      testItem.data.should.deep.equal({ item_id: 'an item' })
    })

    it('should not add erroneous parameters to the item', () => {
      const testData = {
        type: 'item-type',
        key: 'item_id',
        id: 'an item',
        tableName: 'a table',
        region: 'a region',
        param1: 'a param',
        param2: 'another param'
      }

      const testItem = new Item(testData)

      should.not.exist(testItem.param1)
      should.not.exist(testItem.param2)
    })

    it('should throw an error if the required keys are not in the data object', () => {
      const testData = {
      }

      expect(() => new Item(testData)).to.throw('Constructor object requires keys: type, key, id, tableName, region')
    })
  })

  describe('check keys method tests', () => {
    const requiredKeys = ['type', 'key', 'id', 'tableName', 'region']

    requiredKeys.forEach(key => {
      it(`should throw an error if key "${key}" is missing`, () => {
        let data = {
          type: 'item-type',
          key: 'item_id',
          id: 'an item',
          tableName: 'a table',
          region: 'a region'
        }

        delete data[key]

        expect(() => Item.__get__('checkKeys')(data)).to.throw(`Constructor object requires key: ${key}`)
      })
    })

    it('should not throw an error if all required keys are supplied', () => {
      let data = {
        type: 'item-type',
        key: 'item_id',
        id: 'an item',
        tableName: 'a table',
        region: 'a region'
      }

      expect(() => Item.__get__('checkKeys')(data)).to.not.throw()
    })
  })

  describe('populate method tests', () => {
    // This method does nothing on the base class
    // and is only intended for use in child classes
    // where the fields array is non-empty

    class TestItem extends Item {}
    TestItem.fields = ['item_id', 'item_name', 'item_desc']

    it('should populate the data with all the desired parameters', () => {
      let data = {
        type: 'item-type',
        key: 'item_id',
        id: 'an item',
        tableName: 'a table',
        region: 'a region'
      }

      const testData = {
        item_id: 'an item',
        item_name: 'an item name',
        item_desc: 'this is an item'
      }

      const testItem = new TestItem(data)
      testItem.populate(testData)
      testItem.data.should.deep.equal(testData)
    })

    it('should remove any unwanted fields from the data', () => {
      let data = {
        type: 'item-type',
        key: 'item_id',
        id: 'an item',
        tableName: 'a table',
        region: 'a region'
      }

      const testData = {
        item_id: 'an item',
        item_name: 'an item name',
        item_desc: 'this is an item',
        item_param: 'this is unwanted',
        item_param_2: 'this is also unwanted'
      }

      const expected = {
        item_id: 'an item',
        item_name: 'an item name',
        item_desc: 'this is an item'
      }

      const testItem = new TestItem(data)
      testItem.populate(testData)
      testItem.data.should.deep.equal(expected)
    })

    it('should overwrite any existing parameters if new values are provided', () => {
      let data = {
        type: 'item-type',
        key: 'item_id',
        id: 'an item',
        tableName: 'a table',
        region: 'a region'
      }

      const testData = {
        item_id: 'an item',
        item_name: 'an item name',
        item_desc: 'this is an item'
      }

      const testItem = new TestItem(data)
      testItem.populate(testData)
      testItem.data.should.deep.equal(testData)

      const overwrite = {
        item_id: 'a new item',
        item_name: 'a new item name',
        item_desc: 'this is also an item'
      }

      testItem.populate(overwrite)
      testItem.data.should.deep.equal(overwrite)
    })

    it('should not remove existing fields if no new value is provided', () => {
      let data = {
        type: 'item-type',
        key: 'item_id',
        id: 'an item',
        tableName: 'a table',
        region: 'a region'
      }

      const testData = {
        item_id: 'an item',
        item_desc: 'this is an item'
      }

      const testItem = new TestItem(data)
      testItem.populate(testData)
      testItem.data.should.deep.equal(testData)

      const addition = {
        item_name: 'an item name'
      }

      const expected = {
        item_id: 'an item',
        item_name: 'an item name',
        item_desc: 'this is an item'
      }

      testItem.populate(addition)
      testItem.data.should.deep.equal(expected)
    })
  })

  describe('add expiry date method tests', () => {
    let data = {
      type: 'item-type',
      key: 'item_id',
      id: 'an item',
      tableName: 'a table',
      region: 'a region'
    }

    it('should add the correct expiry date for the due date', () => {
      const testItem = new Item(data)
      testItem.data.due_date = '2018-02-23T14:10:06Z'
      testItem.addExpiryDate('due_date')
      testItem.data.expiry_date.should.equal(1519395006)
    })

    it('should not add an expiry date if the expiry field is not set', () => {
      const testItem = new Item(data)
        .addExpiryDate('due_date')
      testItem.data.should.not.have.property('expiry_date')
    })
  })

  describe('save method tests', () => {
    let data = {
      type: 'item-type',
      key: 'item_id',
      id: 'an item',
      tableName: 'a table',
      region: 'a region'
    }

    it('should call the database save method with the loan data', () => {
      const saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.resolves(true)

      const testItem = new Item(data)

      return testItem.save().then(() => {
        saveStub.should.have.been.calledWith(testItem.data)
      })
    })

    it('should be fulfilled if DB#save resolves', () => {
      const saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.resolves(true)

      const testItem = new Item(data)

      return testItem.save().should.eventually.be.fulfilled
    })

    it('should be rejected if DB#save is rejected', () => {
      const saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.rejects(new Error('Database error'))

      const testItem = new Item(data)

      return testItem.save().should.eventually.be.rejectedWith('Database error')
        .and.should.eventually.be.an.instanceOf(Error)
    })
  })

  describe('delete method tests', () => {
    let data = {
      type: 'item-type',
      key: 'item_id',
      id: 'an item',
      tableName: 'a table',
      region: 'a region'
    }

    it('should call DB#delete with the correct key', () => {
      const deleteStub = sandbox.stub(DB.prototype, 'delete')
      deleteStub.resolves(true)

      const testItem = new Item(data)

      return testItem.delete().then(() => {
        deleteStub.should.have.been.calledWith({ item_id: 'an item' })
      })
    })

    it('should be fulfilled if DB#delete resolves', () => {
      const deleteStub = sandbox.stub(DB.prototype, 'delete')
      deleteStub.resolves(true)

      const testItem = new Item(data)

      return testItem.delete().should.eventually.be.fulfilled
    })

    it('should be rejected if DB#delete is rejected', () => {
      const deleteStub = sandbox.stub(DB.prototype, 'delete')
      deleteStub.rejects(new Error('Database error'))

      const testItem = new Item(data)

      return testItem.delete().should.eventually.be.rejectedWith('Database error')
        .and.should.eventually.be.an.instanceOf(Error)
    })
  })
})
