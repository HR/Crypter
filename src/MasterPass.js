'use strict'
/**
 * MasterPass.js
 * MasterPass functionality
 ******************************/

const crypto = require('./crypto')
const _ = require('lodash')

// Check MasterPass
exports.check = function (masterpass) {
  return new Promise(function(resolve, reject) {
    // deriveKey using the salt originally used to generate the
    // MasterPassKey
    crypto.deriveKey(masterpass, global.creds.mpsalt)
      .then((mpk) => {
        // generate the hash for the MasterPassKey
        return crypto.genPassHash(mpk.key, global.creds.mpksalt)
      })
      .then((mpk) => {
        // check if MasterPassKey hash is equal to the MasterPassKey hash
        // (stored in mdb)
        const match = _.isEqual(global.creds.mpkhash, mpk.hash)
        // return teh match and derived key
        resolve({match, key: mpk.key})
      })
      .catch((err) => {
        reject(err)
      })
  })

}

// Set MasterPass
exports.set = function (masterpass) {
  return new Promise(function(resolve, reject) {
    // Derive the MasterPassKey from the supplied masterpass
    crypto.deriveKey(masterpass, null)
      .then((mpk) => {
        // Save the salt used to generate the MasterPassKey
        global.creds.mpsalt = mpk.salt
        // generate the hash for the MasterPassKey
        return crypto.genPassHash(mpk.key, null)
      })
      .then((mpk) => {
        // Save the salt used to generate the masterpass
        global.creds.mpkhash = mpk.hash
        global.creds.mpksalt = mpk.salt
        // return the derived mpkey
        resolve(mpk.key)
      })
      .catch((err) => {
        // reject if error occurs
        reject(err)
      })
  })
}
