'use strict'
const assert = require('assert')
const path = require('path')
const expect = require('chai').expect
const crypto = require('../src/crypto.js')
const util = require('../src/util')
const Db = require('../src/Db')
const MasterPassKey = require('../src/_MasterPassKey')
const MasterPass = require('../src/MasterPass')
const scrypto = require('crypto')
const _ = require('lodash')
const fs = require('fs-extra')

console.log(`cwd: ${process.cwd()}`)
console.log(`__dirname: ${__dirname}`)

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
  const TEST_FILE_CONTENTS = '#Crypter'

  // Before all tests have run
  before(() => {
    // create temporary dir
    fs.ensureDirSync(global.paths.tmp)
    global.mdb = new Db(global.paths.mdb)
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
            expect(dmp.salt instanceof Buffer).to.be.true
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
      describe('encrypt promise', function () {
        it('should encrypt file with pass without errors & have all expected creds', function () {
          return crypto.encrypt(TEST_FILE_PATH, ENCRYTED_TEST_FILE_PATH, global.MasterPassKey.get())
            .then((creds) => {
              // The encrypted file should exist at the ENCRYTED_TEST_FILE_PATH
              expect(util.checkFileSync(ENCRYTED_TEST_FILE_PATH)).to.be.true
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
              expect(file.key).not.be.empty
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
  })
  /**
   * Util module.js
   ******************************/
  describe('Util module', function () {
    const TEST_FILE_PATH = `${global.paths.tmp}/atest.txt`
    // Before any tests are run in this suite
    before(function () {
      // Create test file
      fs.writeFileSync(TEST_FILE_PATH, TEST_FILE_CONTENTS, 'utf8')
    })

    describe('checkFileSync', function () {
      it('should return true if file exist', function (done) {
        expect(util.checkFileSync(TEST_FILE_PATH)).to.be.true
        done()
      })
      it('should return false if file does not exist', function (done) {
        expect(util.checkFileSync('any.file')).to.be.false
        expect(util.checkFileSync('anydir/file')).to.be.false
        done()
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
    let db
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
    before(() => {
      // open test db
      db = new Db(`${global.paths.tmp}/db`)
      // Declare global test object
      global.testObj = {
        name: 'crypto',
        id: 22,
        secure: true
      }
    })

    // After all tests in this suite have run
    after(function () {
      // Close test db
      db.close()
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
          return
        })
        .catch((err) => {
          throw (err)
        })
    })

    it('should save and restore obj correctly persistently', function () {
      // should work still work when db is closed and reopened
      const beforeSaveObj = _.cloneDeep(global.testObj)
      return db.saveGlobalObj('testObj')
        .then(() => {
          // unset global testObj
          global.testObj = null
          // close db
          db.close()
          // reopen the db
          db = new Db(`${global.paths.tmp}/db`)
          return db.restoreGlobalObj('testObj')
        })
        .then(() => {
          // The object restored from the db should equal to the original object
          expect(global.testObj).to.deep.equal(beforeSaveObj)
          return
        })
        .catch((err) => {
          throw (err)
        })
    })

    describe('onlyGetValue', () => {
      it('should resolve value if key exists', function () {
        // Initialise the database with a value
        return putValue('key', 'value')
          .then(() => {
            return db.onlyGetValue('key')
          })
          .then((value) => {
            // The received value should equal the original put value
            expect(value).to.equal('value')
          })
          .catch((err) => {
            throw err
          })
      })
      it('should resolve null if key not found', function () {
        return db.onlyGetValue('notExist')
          .then((value) => {
            expect(value).to.equal(false)
          })
      })
      it('should resolve null if key not found', function () {
        return db.onlyGetValue('')
          .catch((err) => {
            expect(err.message).to.equal('key cannot be an empty String')
          })
      })
    })

    describe('saveGlobalObj', () => {
      it('should not save global object if empty', function () {
        global.b = {}
        return db.saveGlobalObj('b')
          .then(() => {
          })
          .catch((err) => {
            throw err
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
            expect(err).to.be.an('error')
            expect(err.message).to.equal('Converting circular structure to JSON')
          })
      })
    })

    describe('restoreGlobalObj', () => {
      it('should throw error when global object not exist', function () {
        return db.restoreGlobalObj('fake')
          .catch((err) => {
            expect(err.notFound).to.be.true
            expect(err.status).to.equal(404)
          })
      })

      it('should throw error when JSON parse fails', function () {
        return putValue('s', 'i')
          .then(() => {
            return db.restoreGlobalObj('s')
          })
          .catch((err) => {
            expect(err).to.be.an('error')
            expect(err.message).to.equal('Unexpected token i')
          })
      })
    })
  })
})
