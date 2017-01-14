'use strict'
/**
 * MasterPass.js
 * MasterPass functionality
 ******************************/

const crypto = require('./crypto')
const _ = require('lodash')

// TODO: Make independent from global obj! use param instead

// Check MasterPass
exports.check = (masterpass) => {
  return new Promise((resolve, reject) => {
    // deriveKey using the salt originally used to generate the
    // MasterPassKey
    crypto.deriveKey(masterpass, global.creds.mpsalt)
      .then((mpk) => {
        // generate the hash for the MasterPassKey
        return crypto.genPassHash(mpk.key, global.creds.mpksalt)
      })
      .then((mpk) => {
        // check if MasterPassKey hash is equal to the MasterPassKey hash in mdb
        // Use timingSafeEqual to protect against timing attacks
        const match = crypto.timingSafeEqual(global.creds.mpkhash, mpk.hash)
        // return the match and derived key
        resolve({match, key: mpk.key})
      })
      .catch((err) => {
        reject(err)
      })
  })

}

// Set MasterPass
exports.set = (masterpass) => {
  return new Promise((resolve, reject) => {
    // Derive the MasterPassKey from the supplied masterpass
    crypto.deriveKey(masterpass, null)
      .then((mp) => {
        // Save the salt used to generate the MasterPassKey
        global.creds.mpsalt = mp.salt
        // generate the hash for the MasterPassKey
        return crypto.genPassHash(mp.key, null)
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
