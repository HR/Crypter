'use strict'
/**
 * MasterPass.js
 * MasterPass functionality
 ******************************/

const crypto = require('./crypto')
const logger = require('../script/logger')
const _ = require('lodash')
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
        // check if MasterPassKey hash is equal to the stored hash (from mdb)
        const match = _.isEqual(global.creds.mpkhash, mpk.hash)
        logger.info(`match: ${global.creds.mpkhash} (creds.mpkhash) === ${mpk.hash} (mpkhash) = ${match}`)
        resolve({match: match, key: mpk.key})
      })
      .catch((err) => {
        reject(err)
      })
  })

}

exports.set = function (masterpass) {
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
