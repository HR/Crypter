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
const exec = require('child_process').exec

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

  /** Crypto module.js
   ******************************/

  describe('Crypto module', function () {
    describe('deriveKey & genPassHash', function () {
      const masterpass = 'crypto#101'
      it('should deriveKey using a MasterPass correctly when salt is buffer', function () {
        let mpkey
        return crypto.deriveKey(masterpass, null)
          .then((dmp) => {
            expect(dmp.salt instanceof Buffer).to.be.true
            mpkey = dmp.key
            return crypto.deriveKey(masterpass, dmp.salt)
          })
          .then((dmp) => {
            expect(dmp.key.toString('hex')).to.equal(mpkey.toString('hex'))
          })
      })

      it('should deriveKey using a MasterPass correctly with persistent salt', function () {
        let mpkey
        return crypto.deriveKey(masterpass, null)
          .then((dmp) => {
            const pdmpsalt = JSON.parse(JSON.stringify(dmp.salt))
            mpkey = dmp.key
            return crypto.deriveKey(masterpass, pdmpsalt)
          })
          .then((dmp) => {
            expect(dmp.salt instanceof Buffer).to.be.true
            expect(dmp.key.toString('hex')).to.equal(mpkey.toString('hex'))
          })
      })
    })

    describe('Encryption', function () {
      before(function () {
        // create test file
        fs.writeFileSync(TEST_FILE_PATH, '#Crypter', 'utf8')
      })
      describe('crypt promise', function () {
        it('should encrypt file with pass without errors & have all expected creds', function () {
          return crypto.crypt(TEST_FILE_PATH, global.MasterPassKey.get())
            .then((file) => {
              expect(file).not.be.empty
              expect(file.path).to.equal(TEST_FILE_PATH)
              expect(file.cryptPath).to.equal(`${TEST_FILE_PATH}.crypto`)
              expect(file.iv).not.be.empty
              expect(file.salt).not.be.empty
              expect(file.key).not.be.empty
              expect(file.iv).not.be.empty
              expect(file.authTag).not.be.empty
            })
        })
        it('should throw error when pass not supplied', function () {
          return crypto.crypt(TEST_FILE_PATH)
            .catch((err) => {
              expect(err).to.be.an('error')
              expect(err.message).to.equal('Pass to derive key from not provided')
            })
        })
      })
      describe('encrypt promise', function () {
        it(' should throw origin error when empty filepath to encrypt is passed', function () {
          return crypto.encrypt('', `${global.paths.tmp}`, global.MasterPassKey.get())
            .catch((err) => {
              expect(err).to.be.an('error')
              expect(err.message).to.equal("ENOENT: no such file or directory, open ''")
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
    const t1data = '#Crypter'
    before(function () {
      fs.writeFileSync(TEST_FILE_PATH, t1data, 'utf8')
    })

    describe('checkFileSync and checkDirectorySync', function () {
      it('should check if file exists', function (done) {
        expect(util.checkDirectorySync('./')).to.be.true
        expect(util.checkFileSync('any.file')).to.be.false
        expect(util.checkFileSync('anydir/file')).to.be.false
        expect(util.checkFileSync('anydir')).to.be.false
        done()
      })
    })
  })

  /**
   * MasterPass & MasterPassKey module.js
   ******************************/
  describe('MasterPass module', function () {
    after(function () {
      // close mdb after all tests in this suite
      global.mdb.close()
    })
    it('should set and check masterpass', function () {
      const pass = 'V1R3$1NNUM3RI$'
      var mpkey
      return MasterPass.set(pass)
        .then((mpk) => {
          mpkey = mpk
          return MasterPass.check(pass)
        })
        .then((result) => {
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

  describe('MasterPassKey module', function () {
    it('should set and get same masterpasskey', function () {
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
    before(() => {
      // open test db
      db = new Db(`${global.paths.tmp}/db`)
      // global test object
      global.testObj = {
        name: 'crypto',
        id: 22,
        secure: true
      }
    })

    after(function () {
      db.close()
    })
    it('should save and restore obj', function () {
      const beforeSaveObj = _.cloneDeep(global.testObj)
      return db.saveGlobalObj('testObj')
        .then(() => {
          global.testObj = null
          return db.restoreGlobalObj('testObj')
        })
        .then(() => {
          expect(global.testObj).to.deep.equal(beforeSaveObj)
          return
        })
        .catch((err) => {
          throw (err)
        })
    })

    it('should save and restore obj persistently', function () {
      const beforeSaveObj = _.cloneDeep(global.testObj)
      return db.saveGlobalObj('testObj')
        .then(() => {
          global.testObj = null
          db.close()
          db = new Db(`${global.paths.tmp}/db`)
          return db.restoreGlobalObj('testObj')
        })
        .then(() => {
          expect(global.testObj)
            .to.deep.equal(beforeSaveObj)
          return
        })
        .catch((err) => {
          throw (err)
        })
    })

    describe('onlyGetValue', () => {
      it('should resolve value if key exists', function () {
        return putValue('key', 'value')
          .then(() => {
            return db.onlyGetValue('key')
          })
          .then((value) => {
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
