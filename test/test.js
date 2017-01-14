'use strict'
const assert = require('assert')
const path = require('path')
const expect = require('chai').expect
const crypto = require('../app/core/crypto.js')
const Db = require('../app/core/Db')
const MasterPassKey = require('../app/core/MasterPassKey')
const MasterPass = require('../app/core/MasterPass')
const scrypto = require('crypto')
const _ = require('lodash')
const fs = require('fs-extra')

console.log(`cwd: ${process.cwd()}`)
console.log(`__dirname: ${__dirname}`)

let checkFileSync = function (path) {
  try {
    fs.accessSync(path, fs.F_OK)
  } catch (err) {
    if (err.code === 'ENOENT') return false
  }
  return true
}

describe("Crypter Core Modules' tests", function () {
  // Declare globals
  global.creds = {}
  global.paths = {
    mdb: path.join(__dirname, '/tmp/mdb'),
    tmp: path.join(__dirname, '/tmp')
  }
  global.MasterPassKey = new MasterPassKey(scrypto.randomBytes(32))

  // Declare constants
  const KEY_LENGTH = 32 // 32 bytes
  const TEST_FILE_PATH = `${global.paths.tmp}/test.txt`
  const ENCRYTED_TEST_FILE_PATH = `${TEST_FILE_PATH}.crypto`
  const DECRYTED_TEST_FILE_PATH = `${global.paths.tmp}/Decrypted test.txt`
  const TEST_FILE_CONTENTS = '#Crypter'
  const DECRYTING_TEMP_DIR_PATH = `${path.dirname(ENCRYTED_TEST_FILE_PATH)}/.decrypting`
  const ENCRYTING_TEMP_DIR_PATH = `${path.dirname(ENCRYTED_TEST_FILE_PATH)}/.crypting`
  const DB_TEST_FILE_PATH = `${global.paths.tmp}/db`
  const BUF2HEX_TEST_ARR = [248, 27, 158, 201, 66, 216, 80, 254, 81, 104, 238, 9, 1, 231, 134, 106, 8, 202, 44, 89, 231, 61, 99, 139, 167, 162, 21, 216, 127, 85, 142, 86]
  const BUF2HEX_TEST_HEX_EXPECTED = 'f81b9ec942d850fe5168ee0901e7866a08ca2c59e73d638ba7a215d87f558e56'
  const SAFEEQ_TEST_HEX = 'f81b9ec942d850f35168ee0901e7866a08ca2c59e73d638ba7a215d87f558e56'

  // Before all tests have run
  before(() => {
    // create temporary dir
    fs.ensureDirSync(global.paths.tmp)
    global.mdb = new Db(global.paths.mdb, function () {})
  })

  // After all tests have run
  after(() => {
    // remove temporary dir
    fs.removeSync(global.paths.tmp)
  })

  /**
   * Crypto module.js
   ******************************/

  describe('Crypto module', function () {
    it('should convert string buffer to hex string', function () {
      const b2hr = crypto.buf2hex(BUF2HEX_TEST_ARR)
      expect(b2hr).to.equal(BUF2HEX_TEST_HEX_EXPECTED)
    })
    it('should check if two strings are equal time safely', function () {
      expect(crypto.timingSafeEqual(BUF2HEX_TEST_HEX_EXPECTED, BUF2HEX_TEST_HEX_EXPECTED)).to.be.true
      expect(crypto.timingSafeEqual(BUF2HEX_TEST_HEX_EXPECTED, SAFEEQ_TEST_HEX)).to.be.false
      expect(crypto.timingSafeEqual(SAFEEQ_TEST_HEX, BUF2HEX_TEST_HEX_EXPECTED)).to.be.false
      expect(crypto.timingSafeEqual(SAFEEQ_TEST_HEX, BUF2HEX_TEST_HEX_EXPECTED)).to.be.false
      expect(crypto.timingSafeEqual('ew', 'we4')).to.throw('TypeError: Input buffers must have the same length')
    })
    describe('deriveKey (and genPassHash)', function () {
      // deriveKey uses genPassHash Promise internally. Testing the derived
      // MasterPassKey before and after also suffienctly tests genPassHash
      // (indirectly test the hash before and after)

      const masterpass = 'crypto#101'
      it('should deriveKey using a MasterPass correctly when salt is buffer', function () {
        let mpkey
        return crypto.deriveKey(masterpass, null)
          .then((dmp) => {
            // derived salt should be a Buffer
            expect(dmp.salt instanceof Buffer).to.be.true
            mpkey = dmp.key
            return crypto.deriveKey(masterpass, dmp.salt)
          })
          .then((dmp) => {
            // The newly derive MPK should equal to the originally derived MPK
            expect(dmp.key.toString('hex')).to.equal(mpkey.toString('hex'))
          })
      })

      it('should deriveKey using a MasterPass correctly with persistent salt', function () {
        let mpkey
        return crypto.deriveKey(masterpass, null)
          .then((dmp) => {
            // Serialize and deserialize the derived salt
            const pdmpsalt = JSON.parse(JSON.stringify(dmp.salt))
            mpkey = dmp.key
            // Used deserialized salt to derive key
            return crypto.deriveKey(masterpass, pdmpsalt)
          })
          .then((dmp) => {
            // The deserialized salt should successfully create a Buffer
            expect(Buffer.isBuffer(dmp.salt)).to.be.true
            // The deserialized salt should have been used to recreate the
            // Buffer orginally used to derive the key correctly which should
            // result in the newly derive MPK equalling to the originally
            // derived MPK
            expect(dmp.key.toString('hex')).to.equal(mpkey.toString('hex'))
          })
      })
    })

    describe('Encryption', function () {
      // Before any tests are run in this suite
      before(function () {
        // create a test file (for encryption)
        fs.writeFileSync(TEST_FILE_PATH, TEST_FILE_CONTENTS, 'utf8')
      })
      after(function () {
        fs.removeSync(ENCRYTING_TEMP_DIR_PATH)
      })
      describe('encrypt promise', function () {
        it('should encrypt file with pass without errors & have all expected creds', function () {
          return crypto.encrypt(TEST_FILE_PATH, global.MasterPassKey.get())
            .then((creds) => {
              // The encrypted file should exist at the ENCRYTED_TEST_FILE_PATH
              expect(checkFileSync(ENCRYTED_TEST_FILE_PATH)).to.be.true
              expect(checkFileSync(ENCRYTING_TEMP_DIR_PATH)).to.be.false
              // Creds should have all the expected properties
              expect(creds).not.be.empty
              expect(creds.iv).not.be.empty
              expect(creds.salt).not.be.empty
              expect(creds.key).not.be.empty
              expect(creds.tag).not.be.empty
            })
            .catch((err) => {
              throw err
            })
        })
        it('should throw origin error when empty filepath to encrypt is passed', function () {
          return crypto.encrypt('', `${global.paths.tmp}`, global.MasterPassKey.get())
            .catch((err) => {
              expect(err).to.be.an('error')
              expect(err.message).to.equal("ENOENT: no such file or directory, open ''")
            })
        })
      })
      describe('crypt promise', function () {
        // Before any tests are run in this suite
        before(function () {
          // create test file
          fs.removeSync(ENCRYTED_TEST_FILE_PATH)
        })
        it('should encrypt file with MPK without errors & have all expected properties', function () {
          return crypto.crypt(TEST_FILE_PATH, global.MasterPassKey.get())
            .then((file) => {
              expect(file).not.be.empty
              // The file object should have all the properties
              expect(file.path).to.equal(TEST_FILE_PATH)
              expect(file.cryptPath).to.equal(ENCRYTED_TEST_FILE_PATH)
              expect(file.iv).not.be.empty
              expect(file.salt).not.be.empty
              // Expect key length to be 32 bytes (256 bits)
              // expect(file.key.length).to.equal(KEY_LENGTH);
              expect(file.authTag).not.be.empty
            })
        })
        it('should throw error when MPK not supplied', function () {
          return crypto.crypt(TEST_FILE_PATH)
            .catch((err) => {
              expect(err).to.be.an('error')
              expect(err.message).to.equal('Pass to derive key from not provided')
            })
        })
      })
    })

    describe('Decryption', function () {
      // Before any tests are run in this suite
      before(function () {
        // create a test file (for encryption)
        expect(checkFileSync(ENCRYTED_TEST_FILE_PATH)).to.be.true
      })
      after(function () {
        fs.removeSync(DECRYTING_TEMP_DIR_PATH)
      })
      describe('decrypt promise', function () {
        it('should decrypt file with pass without errors & have all expected creds', function () {
          return crypto.decrypt(ENCRYTED_TEST_FILE_PATH, global.MasterPassKey.get())
            .then((file) => {
              // The encrypted file should exist at the ENCRYTED_TEST_FILE_PATH
              expect(checkFileSync(DECRYTED_TEST_FILE_PATH)).to.be.true
              // Creds should have all the expected properties
              expect(file.op).to.equal('Decrypted')
              expect(file.cryptPath).to.equal(DECRYTED_TEST_FILE_PATH)
              expect(file.salt).not.be.empty
              expect(file.key).not.be.empty
              expect(file.authTag).not.be.empty
              expect(checkFileSync(DECRYTING_TEMP_DIR_PATH)).to.be.false
            })
            .catch((err) => {
              throw err
            })
        })
        it('should throw origin error when empty filepath to encrypt is passed', function () {
          return crypto.decrypt('', global.MasterPassKey.get())
            .catch((err) => {
              expect(err).to.be.an('error')
              expect(err.message).to.equal("ENOENT: no such file or directory, open ''")
            })
        })
      })
    })
  })
  /**
   * MasterPass module.js
   ******************************/
  describe('MasterPass module', function () {
    after(function () {
      // close mdb after all tests in this suite
      global.mdb.close()
    })
    it('should set and check masterpass correctly', function () {
      const pass = 'V1R3$1NNUM3RI$'
      var mpkey
      return MasterPass.set(pass)
        .then((mpk) => {
          mpkey = mpk
          return MasterPass.check(pass)
        })
        .then((result) => {
          // Should give match when the correct pass (the one originally set) is
          // checked
          expect(result.match).to.be.true
          expect(result.key.toString('hex')).to.equal(mpkey.toString('hex'))
        })
    })

    it('should throw error if not provided when checking', function () {
      const pass = ''
      return MasterPass.check(pass)
        .catch((err) => {
          expect(err).to.be.an('error')
          expect(err.message).to.equal('Pass to derive key from not provided')
        })
    })

    it('should throw error if not provided when setting', function () {
      const pass = ''
      return MasterPass.set(pass)
        .catch((err) => {
          expect(err).to.be.an('error')
          expect(err.message).to.equal('Pass to derive key from not provided')
        })
    })
  })

  /**
   * MasterPassKey module.js
   ******************************/
  describe('MasterPassKey module', function () {
    it('should get the same masterpasskey that was used to set', function () {
      const mpkey = scrypto.randomBytes(KEY_LENGTH)
      const newMPK = scrypto.randomBytes(KEY_LENGTH)
      const MPK = new MasterPassKey(mpkey)
      expect(MPK.get()).to.deep.equal(mpkey)
      expect(MPK.get() instanceof Buffer).to.be.true
      MPK.set(newMPK)
      expect(MPK.get()).to.deep.equal(newMPK)
    })
    it('should throw error when deleted and get called', function () {
      const mpkey = scrypto.randomBytes(KEY_LENGTH)
      const MPK = new MasterPassKey(mpkey)
      MPK.delete()
      expect(MPK.get()).to.be.an('error')
      expect(MPK.get().message).to.equal('MasterPassKey is not set')
    })
    it('should throw error when not instantiated with key', function () {
      const MPK = new MasterPassKey()
      expect(MPK.get()).to.be.an('error')
      expect(MPK.get().message).to.equal('MasterPassKey is not set')
    })
    it('should throw error when instantiated with data type other than a Buffer', function () {
      const MPK = new MasterPassKey()
      expect(MPK.set('pass')).to.be.an('error')
      expect(MPK.set().message).to.equal('MasterPassKey not a Buffer')
    })
  })

  /**
   * Db module.js
   ******************************/
  describe('Db module', function () {
    var db
    // Helper promises
    let putValue = function (key, value) {
      return new Promise(function (resolve, reject) {
        db.put(key, value, function (err) {
          if (err) reject(err) // db save error
          resolve()
        })
      })
    }
    let close = function (key, value) {
      return new Promise(function (resolve, reject) {
        db.put(key, value, function (err) {
          if (err) reject(err) // db save error
          resolve()
        })
      })
    }
    // Before any tests are run in this suite
    beforeEach((done) => {
      // open test db
      db = new Db(DB_TEST_FILE_PATH, function(){
        done()
      })
      // Declare global test object
      global.testObj = {
        name: 'crypto',
        id: 22,
        secure: true
      }
    })

    // After all tests in this suite have run
    afterEach(function () {
      // Close test db
      db.close()
      fs.removeSync(DB_TEST_FILE_PATH)
    })
    it('should save and restore obj correctly', function () {
      const beforeSaveObj = _.cloneDeep(global.testObj)
      return db.saveGlobalObj('testObj')
        .then(() => {
          global.testObj = null
          return db.restoreGlobalObj('testObj')
        })
        .then(() => {
          // The object restored from the db should equal to the original object
          expect(global.testObj).to.deep.equal(beforeSaveObj)
        })
        .catch((err) => {
          throw (err)
        })
    })

    it('should save and restore obj correctly persistently and db.open', function () {
      // should work still work when db is closed and reopened
      const beforeSaveObj = _.cloneDeep(global.testObj)
      return db.saveGlobalObj('testObj')
        .then(() => {
          // unset global testObj
          global.testObj = null
          expect(db.open).to.be.true
          // close db
          return db.close()
        })
        .then(() => {
          expect(db.open).to.be.false
        })
        .catch((err) => {
          throw (err)
        })
    })

    describe('put and get', () => {
      it('should resolve value if key exists', function () {
        // Initialise the database with a value
        return db.put('key', 'value')
          .then(() => {
            return db.get('key')
          })
          .then((value) => {
            // The received value should equal the original put value
            expect(value).to.equal('value')
          })
          .catch((err) => {
            throw err
          })
      })
      it('should resolve false if key not found', function () {
        return db.get('notExist')
          .then((value) => {
            expect(value).to.equal(false)
          })
          .catch((err) => {
            throw err
          })
      })
    })

    describe('saveGlobalObj', () => {
      it('should not save global object if empty', function () {
        global.b = {}
        return db.saveGlobalObj('b')
          .then(() => {
            global.b = null
            return db.restoreGlobalObj('b')
          })
          .catch((err) => {
            // Expect the object not to be found
            expect(err.notFound).to.be.true
            expect(err.status).to.equal(404)
            // Expect global.b to not have been restored
            // i.e. remained null (set after saveGlobalObj)
            expect(global.b).to.be.null
          })
      })
      it('should throw error when JSON stringify fails', function () {
        global.g = {}
        global.g.a = {
          b: global.g
        }
        // Serializing an (unserializable) object should give error
        return db.saveGlobalObj('g')
          .catch((err) => {
            // Expect an error to occur
            expect(err).to.be.an('error')
            expect(err.message).to.equal('Converting circular structure to JSON')
          })
      })
    })

    describe('restoreGlobalObj', () => {
      it('should throw error when global object not exist', function () {
        return db.restoreGlobalObj('fake')
          .catch((err) => {
            // Expect an error to occur
            expect(err.notFound).to.be.true
            expect(err.status).to.equal(404)
          })
      })

      it('should throw error when JSON parse fails', function () {
        return db.put('s', 'i')
          .then(() => {
            return db.restoreGlobalObj('s')
          })
          .catch((err) => {
            // Expect an error to occur
            expect(err).to.be.an('error')
          })
      })
    })
  })
})
