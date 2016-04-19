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

exports.check = function (masterpass) {
  return new Promise(function(resolve, reject) {
    crypto.derivePassKey(masterpass, global.creds.mpsalt)
      .then((mpk) => {
        return crypto.genPassHash(mpk.key, global.creds.mpksalt)
      })
      .then((mpk) => {
        const match = crypto.verifyPassHash(global.creds.mpkhash, mpk.hash) // check if masterpasskey derived is correct
        logger.info(`match: ${global.creds.mpkhash} (creds.mpkhash) === ${mpk.hash} (mpkhash) = ${mpk.match}`)
        resolve({match: match, key: mpk.key})
      })
      .catch((err) => {
        reject(err)
      })
  })

}

exports.set = function (masterpass) {
  // TODO: decide whther to put updated masterpass instantly
  // logger.verbose(`setMasterPass() for ${masterpass}`)
  return new Promise(function(resolve, reject) {
    crypto.derivePassKey(masterpass, null)
      .then((mpk) => {
        global.creds.mpsalt = mpk.salt
        return crypto.genPassHash(mpk.key, null)
      })
      .then((mpk) => {
        global.creds.mpkhash = mpk.hash
        global.creds.mpksalt = mpk.salt
        resolve(mpk.key)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
