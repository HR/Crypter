'use strict'
const assert = require('assert')
const path = require('path')
const expect = require('chai').expect
const crypto = require('../src/crypto.js')
const util = require('../src/util')
const Db = require('../src/Db')
const MasterPassKey = require('../src/_MasterPassKey')
// const synker = require('../src/synker')
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
    fs.removeSync(global.paths.home)
  })


  /** Crypto module.js
   ******************************/

  describe('Crypto module', function () {
    before(function () {
      fs.writeFileSync(t1path, '#Crypter', 'utf8')
    })

    describe('Hashing & deriving', function () {
      const masterpass = 'crypto#101'

      it('should get same digest hash for genFileHash as openssl', function () {
        return crypto.genFileHash(t1path)
          .then((hash) => {
            global.execute(`openssl dgst -md5 ${t1path}`)
              .then((stdout) => {
                let ohash = stdout.replace('MD5(test.txt)= ', '')
                expect(hash)
                  .to.equal(ohash)
                expect(crypto.verifyFileHash(hash, ohash))
                  .to.be.true
                expect(false).to.true
              })
              .catch((err) => {
                throw err
              })
          })
          .catch((err) => {
            throw err
          })
      })

      it('should derivePassKey using a MasterPass correctly when salt is buffer', function (done) {
        crypto.derivePassKey(masterpass, null, function (err, dmpkey, dmpsalt) {
          if (err) done(err)
          crypto.derivePassKey(masterpass, dmpsalt, function (err, mpkey, mpsalt) {
            if (err) done(err)
            expect(dmpkey.toString('hex'))
              .to.equal(mpkey.toString('hex'))
            done()
          })
        })
      })

      it('should derivePassKey using a MasterPass correctly with persistent salt', function (done) {
        crypto.derivePassKey(masterpass, null, function (err, dmpkey, dmpsalt) {
          if (err) done(err)
          const pdmpsalt = JSON.parse(JSON.stringify(dmpsalt))
          crypto.derivePassKey(masterpass, pdmpsalt, function (err, mpkey, mpsalt) {
            if (err) done(err)
            expect(dmpkey.toString('hex'))
              .to.equal(mpkey.toString('hex'))
            done()
          })
        })
      })
    })

    describe('Encryption', function () {
      it('should generate iv, encrypt & decrypt an obj with MPKey when salt is buffer', function (done) {
        const toCryptObj = _.cloneDeep(global.vault)
        const fpath = `${global.paths.tmp}/cryptedObj.crypto`
        crypto.genIV()
          .then(function (viv) {
            crypto.encryptObj(toCryptObj, fpath, global.MasterPassKey.get(), viv, function (err, authTag) {
              if (err) done(err)
              crypto.decryptObj(fpath, global.MasterPassKey.get(), viv, authTag, function (err, devaulted) {
                if (err) done(err)
                expect(devaulted)
                  .to.deep.equal(toCryptObj)
                done()
              })
            })
          })
          .catch((err) => {
            done(err)
          })
      })

      it('should generate iv, encrypt & decrypt vault obj with MPKey with persistent salt', function (done) {
        const toCryptObj = _.cloneDeep(global.vault)
        const fpath = `${global.paths.tmp}/cryptedObj2.crypto`
        crypto.genIV()
          .then(function (viv) {
            const pviv = JSON.parse(JSON.stringify(viv))
            crypto.encryptObj(toCryptObj, fpath, global.MasterPassKey.get(), pviv, function (err, authTag) {
              if (err) done(err)
              crypto.decryptObj(fpath, global.MasterPassKey.get(), viv, authTag, function (err, devaulted) {
                if (err) done(err)
                expect(devaulted)
                  .to.deep.equal(toCryptObj)
                done()
              })
            })
          })
          .catch((err) => {
            done(err)
          })
      })

      it('should encrypt file with pass without errors & have all expected creds', function (done) {
        before(function () {
          fs.writeFileSync(t1path, '#Crypter', 'utf8')
        })
        crypto.encrypt(t1path, `${t1path}.crypto`, global.MasterPassKey.get(), function (err, key, iv, tag) {
          if (err) done(err)
          try {
            let file = {}
            file.iv = iv.toString('hex')
            file.authTag = tag.toString('hex')
            done()
          } catch (err) {
            if (err) done(err)
          }
        })
      })

      // it('should encrypt and decrypt file with pass', function (done) {
      // 	let cryptoPath = '${t1path}.crypto'
      // 	crypto.encrypt(t1path, cryptoPath, global.MasterPassKey.get(), function (err, key, iv, tag) {
      // 		if (err) done(err)
      // 		crypto.decrypt(cryptoPath, '${global.paths.tmp}/test2.txt', key, null, null, function (err, iv, tag) {
      // 			if (err) done(err)
      // 			fs.readFile('${global.paths.tmp}/test2.txt', function read(err, data) {
      // 				if (err) done(err)
      // 				expect(data.toString('utf8')).to.equal('#Crypter')
      // 				done()
      // 			})
      // 		})
      // 	})
      // })

      it('should convert key to shares and back with shares obj', function (done) {
        const key = scrypto.randomBytes(defaults.keyLength)
          .toString('hex')
        const sharesObj = crypto.pass2shares(key)
        const ckey = crypto.shares2pass(sharesObj)
        const ckeyArray = crypto.shares2pass(sharesObj.data)
        expect(ckey)
          .to.equal(key)
        expect(ckeyArray)
          .to.equal(key)
        done()
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
            .to.equal(null)
          db.close()
        })
    })

    // it('should throw error when global object not exist for restoreGlobalObj', function () {
    //   return db.saveGlobalObj('fake')
    //     .catch((err) => {
    //       expect(false).to.be(true)
    //       expect(err).to.be.an('error')
    //       expect(err.message).to.equal('Unsupported state or unable to authenticate data')
    //       db.close()
    //     })
    // })

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

    it('should convert ReadableStream into a valid utf-8 string for streamToString', function (done) {
      const readStream = fs.createReadStream(t1path)
      readStream.on('error', (e) => {
        done(e)
      })
      util.streamToString(readStream, function (err, string) {
        if (err) done(err)
        expect(string)
          .to.deep.equal(t1data)
        done()
      })
    })

    it('should check if file exists', function (done) {
      expect(util.checkFileSync(`${global.paths.data}/rfile.json`))
        .to.be.true
      expect(util.checkFileSync(`${global.paths.data}/rfs.json`))
        .to.be.true
      expect(util.checkDirectorySync(`${global.paths.data}`))
        .to.be.true
      expect(util.checkFileSync(`${global.paths.data}`))
        .to.be.true
      expect(util.checkDirectorySync(`${global.paths.data}/rfs.json`))
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
    it('should set and check masterpass', function (done) {
      const pass = 'V1R3$1NNUM3RI$'
      MasterPass.set(pass, function (err, mpkey) {
        if (err) done(err)
        MasterPass.check(pass, function (err, MATCH, dmpkey) {
          if (err) done(err)
          expect(MATCH)
            .to.be.true
          expect(dmpkey.toString('hex'))
            .to.equal(mpkey.toString('hex'))
          done()
        })
      })
    })

    it('should throw error if not provided or undefined', function (done) {
      const pass = ''
      MasterPass.check(pass, function (err, MATCH, dmpkey) {
        expect(err).to.be.an('error')
        expect(err.message).to.equal('MasterPassKey not provided')
        done()
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
