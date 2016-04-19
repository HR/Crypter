'use strict'
const assert = require('assert')
const path = require('path')
const expect = require('chai').expect
const crypto = require('../src/crypto.js')
const util = require('../src/util')
const Db = require('../src/Db')
const MasterPassKey = require('../src/_MasterPassKey')
const MasterPass = require('../src/MasterPass')
// const logger = require('../script/logger')
const scrypto = require('crypto')
const _ = require('lodash')
const fs = require('fs-extra')
const exec = require('child_process').exec

console.log(`cwd: ${process.cwd()}`)
console.log(`__dirname: ${__dirname}`)

describe("Crypter Core Modules' tests", function () {
  global.paths = {
    mdb: path.join(__dirname,'/tmp/mdb'),
    tmp: path.join(__dirname,'/tmp')
  }
  console.log(require('util').inspect(global.paths, { depth: null }))


  global.defaults = {
    iterations: 4096, // file encryption key iterations
    keyLength: 32, // in bytes
    ivLength: 12,
    algorithm: 'aes-256-gcm',
    salgorithm: 'aes-256-ctr',
    digest: 'sha256',
    hash_alg: 'sha256',
    check_hash_alg: 'md5',
    padLength: 1024,
    mpk_iterations: 100000, // masterpass key iterations
    shares: 3,
    threshold: 2
  }

  global.vault = {
    'RAND0M-ID3': {
      name: 'crypto',
      id: 22,
      secure: true
    },
    'R3C0M-I4D': {
      name: 'cry9to',
      id: 2090,
      secure: false
    }
  }

  global.creds = {}

  // Declare globals
  fs.ensureDirSync(global.paths.tmp)
  global.MasterPassKey = new MasterPassKey(scrypto.randomBytes(global.defaults.keyLength))
  global.mdb = new Db(global.paths.mdb)

  const t1path = `${global.paths.tmp}/test.txt`
  // Before all tests have run
  before(function () {
    global.execute = function (command, callback) {
      return new Promise(function (resolve, reject) {
        exec(command, function (err, stdout, stderr) {
          resolve(stdout)
        })
      })
    }
  })

  // After all tests have run
  after(function () {
    fs.removeSync(global.paths.tmp)
  })


  /** Crypto module.js
   ******************************/

  describe('Crypto module', function () {
    before(function () {
      fs.writeFileSync(t1path, '#Crypter', 'utf8')
    })

    describe('Hashing & deriving', function () {
      const masterpass = 'crypto#101'
      it('should derivePassKey using a MasterPass correctly when salt is buffer', function () {
        let mpkey
        return crypto.derivePassKey(masterpass, null)
          .then((dmp) => {
            mpkey = dmp.key
            return crypto.derivePassKey(masterpass, dmp.salt)
          })
          .then((dmp) => {
            expect(dmp.key.toString('hex'))
              .to.equal(mpkey.toString('hex'))
          })
      })

      it('should derivePassKey using a MasterPass correctly with persistent salt', function () {
        let mpkey
        return crypto.derivePassKey(masterpass, null)
          .then((dmp) => {
            const pdmpsalt = JSON.parse(JSON.stringify(dmp.salt))
            mpkey = dmp.key
            return crypto.derivePassKey(masterpass, pdmpsalt)
          })
          .then((dmp) => {
            expect(dmp.key.toString('hex'))
              .to.equal(mpkey.toString('hex'))
          })
      })
    })

    describe('Encryption', function () {
      it('should encrypt file with pass without errors & have all expected creds', function () {
        before(function () {
          fs.writeFileSync(t1path, '#Crypter', 'utf8')
        })
        return crypto.crypt(t1path, global.MasterPassKey.get())
          .then((file) => {
            expect(file).not.be.empty
            expect(file.path).to.equal(t1path)
            expect(file.cryptPath).to.equal(`${t1path}.crypto`)
            expect(file.iv).not.be.empty
            expect(file.salt).not.be.empty
            expect(file.key).not.be.empty
            expect(file.iv).not.be.empty
            expect(file.authTag).not.be.empty
          })
      })
    })
  })

  /**
   * Db module.js
   ******************************/
  describe('Db module', function () {
    let db
    beforeEach(function () {
      db = new Db(`${global.paths.tmp}/db`)
      global.testo = {
        'RAND0M-ID3': {
          name: 'crypto',
          id: 22,
          secure: true
        }
      }
    })
    it('should save and restore obj', function () {
      const beforeSaveObj = _.cloneDeep(global.testo)
      return db.saveGlobalObj('testo')
        .then(() => {
          global.testo = null
          return db.restoreGlobalObj('testo')
        })
        .then(() => {
          expect(global.testo)
            .to.deep.equal(beforeSaveObj)
          db.close()
          return
        })
        .catch((err) => {
          throw (err)
        })
    })

    it('should save and restore obj persistently', function () {
      const beforeSaveObj = _.cloneDeep(global.testo)
      return db.saveGlobalObj('testo')
        .then(() => {
          global.testo = null
          db.close()
          db = new Db(`${global.paths.tmp}/db`)
          return db.restoreGlobalObj('testo')
        })
        .then(() => {
          expect(global.testo)
            .to.deep.equal(beforeSaveObj)
          db.close()
          return
        })
        .catch((err) => {
          throw (err)
        })
    })

    it('should return null if key not found for onlyGetValue', function () {
      return db.onlyGetValue('notExist')
        .then((token) => {
          expect(token)
            .to.equal(false)
          db.close()
        })
    })

    it('should throw error when global object not exist for restoreGlobalObj', function () {
      return db.restoreGlobalObj('fake')
        .catch((err) => {
          expect(err.notFound).to.be.true
          expect(err.status).to.equal(404)
          db.close()
        })
    })

  })
  /**
   * Util module.js
   ******************************/
  describe('Util module', function () {
    const t1path = `${global.paths.tmp}/atest.txt`
    const t1data = '#Crypter'
    before(function () {
      fs.writeFileSync(t1path, t1data, 'utf8')
    })

    it('should check if file exists', function (done) {
      expect(util.checkDirectorySync('./'))
        .to.be.true
      expect(util.checkFileSync('any.file'))
        .to.be.false
      expect(util.checkFileSync('anydir/file'))
        .to.be.false
      expect(util.checkFileSync('anydir'))
        .to.be.false
      done()
    })
  })

  /**
   * MasterPass & MasterPassKey module.js
   ******************************/
  describe('MasterPass module', function () {
    it('should set and check masterpass', function () {
      const pass = 'V1R3$1NNUM3RI$'
      var mpkey
      return MasterPass.set(pass)
        .then((mpk) => {
          mpkey = mpk
          return MasterPass.check(pass)
        })
        .then((result) => {
          expect(result.match)
            .to.be.true
          expect(result.key.toString('hex'))
            .to.equal(mpkey.toString('hex'))
        })
    })

    it('should throw error if not provided or undefined', function () {
      const pass = ''
      return MasterPass.check(pass)
        .catch((err) => {
          expect(err).to.be.an('error')
          expect(err.message).to.equal('MasterPassKey not provided')
        })
    })
  })

  describe('MasterPassKey module', function () {
    it('should set and get same masterpasskey', function () {
      const mpkey = scrypto.randomBytes(global.defaults.keyLength)
      const newMPK = scrypto.randomBytes(global.defaults.keyLength)
      const MPK = new MasterPassKey(mpkey)
      expect(MPK.get()).to.deep.equal(mpkey)
      expect(MPK.get() instanceof Buffer).to.be.true
      MPK.set(newMPK)
      expect(MPK.get()).to.deep.equal(newMPK)
    })
    it('should throw error when deleted and get called', function () {
      const mpkey = scrypto.randomBytes(global.defaults.keyLength)
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
  })
})
