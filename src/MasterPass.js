'use strict'
/**
 * MasterPass.js
 * MasterPass functionality
 ******************************/

const crypto = require('./crypto')
const logger = require('../script/logger')
const Main = (process.env.TEST_RUN) ? null : require('../index')

exports.Prompt = function () {
  return new Promise(function (resolve, reject) {
    Main.MasterPassPromptWindow(function (err, gotMP) {
      if (err) reject(err)
      if (gotMP) {
        resolve()
      } else {
        reject(new Error('Could not get MasterPass'))
      }
    })
  })
}

exports.check = function (masterpass, callback) {
  crypto.derivePassKey(masterpass, global.creds.mpsalt, function (err, mpkey, mpsalt) {
    // logger.verbose('checkMasterPass derivePassKey callback')
    if (err) {
      logger.error(`ERROR: derivePassKey failed, ${err.stack}`)
      return callback(err, null)
    }
    crypto.genPassHash(mpkey, global.creds.mpksalt, function (mpkhash) {
      // logger.verbose(`creds.mpkhash = ${global.creds.mpkhash}, mpkhash (of entered mp) = ${mpkhash}`)
      const MATCH = crypto.verifyPassHash(global.creds.mpkhash, mpkhash) // check if masterpasskey derived is correct
      logger.info(`MATCH: ${global.creds.mpkhash} (creds.mpkhash) === ${mpkhash} (mpkhash) = ${MATCH}`)
      return callback(null, MATCH, mpkey)
    })
  })
}

exports.set = function (masterpass, callback) {
  // TODO: decide whther to put updated masterpass instantly
  // logger.verbose(`setMasterPass() for ${masterpass}`)
  crypto.derivePassKey(masterpass, null, function (err, mpkey, mpsalt) {
    if (err) return callback(err)
    global.creds.mpsalt = mpsalt
    // logger.verbose(`\n global.creds.mpsalt = ${global.creds.mpsalt.toString('hex')}`)
    crypto.genPassHash(mpkey, null, function (mpkhash, mpksalt) {
      global.creds.mpkhash = mpkhash
      global.creds.mpksalt = mpksalt
      return callback(null, mpkey)
    // logger.verbose(`derivePassKey callback: \npbkdf2 mpkey = ${mpkey.toString('hex')},\nmpsalt = ${global.creds.mpsalt.toString('hex')},\nmpkhash = ${mpkhash},\nmpksalt = ${mpksalt}`)
    })
  })
}
