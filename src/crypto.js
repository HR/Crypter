'use strict'
/**
 * crypto.js
 * Provides the crypto functionality required
 ******************************/

const secrets = require('secrets.js')
const fs = require('fs-extra')
const util = require('./util')
const logger = require('../script/logger')
const _ = require('lodash')
const Readable = require('stream').Readable
const crypto = require('crypto')

// Crypto default constants
// TODO: change accordingly when changed in settings
let defaults = {
  iterations: 50000, // file encryption key iterations
  keyLength: 32, // 32 bytes
  ivLength: 12,
  algorithm: 'aes-256-gcm',
  digest: 'sha256',
  hash_alg: 'sha256',
  check_hash_alg: 'md5',
  padLength: 1024, // 1 MB
  mpk_iterations: 100000, // masterpass key iterations
  shares: 3,
  th: 2
}

/*	Crypto
 *
 *	TODO:
 *	- Implement bitcoin blockchain as source of randomness (in iv generation)
 *  - rewrite as promises
 */

exports.encrypt = function (origpath, destpath, mpkey) {
  // decrypts any arbitrary data passed with the pass
  return new Promise(function (resolve, reject) {
    const salt = crypto.randomBytes(defaults.keyLength) // generate pseudorandom salt
    crypto.pbkdf2(mpkey, salt, defaults.iterations, defaults.keyLength, defaults.digest, (err, key) => {
      if (err) {
        // return error to callback YOLO#101
        reject(err)
      }
      // logger.verbose(`Pbkdf2 generated key ${key.toString('hex')} using iv = ${iv.toString('hex')}, salt = ${salt.toString('hex')}`)
      const origin = fs.createReadStream(origpath)
      const dest = fs.createWriteStream(destpath)
      const iv = crypto.randomBytes(defaults.ivLength) // generate pseudorandom iv
      const cipher = crypto.createCipheriv(defaults.algorithm, key, iv)

      origin.pipe(cipher).pipe(dest)

      cipher.on('error', () => {
        logger.verbose(`CIPHER STREAM: Error while encrypting file`)
        reject(err)
      })

      origin.on('error', () => {
        logger.verbose(`ORIGIN STREAM: Error while reading file to ${destpath}`)
        reject(err)
      })

      dest.on('error', () => {
        logger.verbose(`DEST STREAM: Error while writting file to ${destpath}`)
        reject(err)
      })

      dest.on('finish', () => {
        const tag = cipher.getAuthTag()
        logger.verbose(`Finished encrypted/written to ${destpath}`)
        resolve({
          salt: salt,
          key: key,
          iv: iv,
          tag: tag
        })
      })

    })
  })

}

exports.genIV = function () {
  return new Promise(function (resolve, reject) {
    try {
      const iv = crypto.randomBytes(defaults.ivLength) // Synchronous gen
      resolve(iv)
    } catch (err) {
      reject(err)
    }
  })
}

exports.genSalt = function () {
  return new Promise(function (resolve, reject) {
    try {
      const salt = crypto.randomBytes(defaults.keyLength) // Synchronous gen
      resolve(salt)
    } catch (err) {
      reject(err)
    }
  })
}

exports.derivePassKey = function (pass, psalt, callback) {
  if (!pass) return callback(new Error('MasterPassKey not provided'))
    // If psalt is provided
  const salt = (psalt) ? ((psalt instanceof Buffer) ? psalt : new Buffer(psalt.data)) : crypto.randomBytes(defaults.keyLength)
  crypto.pbkdf2(pass, salt, defaults.mpk_iterations, defaults.keyLength, defaults.digest, (err, pkey) => {
    if (err) {
      // return error to callback
      return callback(err)
    } else {
      // logger.verbose(`Pbkdf2 generated: \npkey = ${pkey.toString('hex')} \nwith salt = ${salt.toString('hex')}`)
      return callback(null, pkey, salt)
    }
  })
}

// create a sha256 hash of the MasterPassKey
exports.genPassHash = function (mpass, salt, callback) {
  // logger.verbose(`crypto.genPassHash() invoked`)
  const pass = (mpass instanceof Buffer) ? mpass.toString('hex') : mpass

  if (salt) {
    const hash = crypto.createHash(defaults.hash_alg).update(`${pass}${salt}`).digest('hex')
      // logger.verbose(`genPassHash: S, pass = ${pass}, salt = ${salt}, hash = ${hash}`)
    callback(hash)
  } else {
    const salt = crypto.randomBytes(defaults.keyLength).toString('hex')
    const hash = crypto.createHash(defaults.hash_alg).update(`${pass}${salt}`).digest('hex')
      // logger.verbose(`genPassHash: NS, pass = ${pass}, salt = ${salt}, hash = ${hash}`)
    callback(hash, salt)
  }
}

// check if calculated hash is equal to stored hash
exports.verifyPassHash = function (mpkhash, gmpkhash) {
  return _.isEqual(mpkhash, gmpkhash)
}

// exports.pass2shares = function (pass) {
//   // splits the pass into shares using Shamir's Secret Sharing
//   // convert the text into a hex string
//   try {
//     // pass = secrets.str2hex(pass) split into N shares, with a threshold of th
//     // Zero padding of defaults.padLength applied to ensure minimal info leak
//     // (i.e size of pass)
//     const shares = secrets.share(pass, defaults.shares, defaults.th, defaults.padLength)
//     const sharesd = {
//       data: shares,
//       total: defaults.th,
//       threshold: th
//     }
//     return sharesd
//   } catch (err) {
//     throw err
//   }
// }
//
// /**
//  * @param {array} of at least the threshold length
//  */
// exports.shares2pass = function (sharesd) {
//   // reconstructs the pass from the shares of the pass
//   // using Shamir's Secret Sharing
//   // let S = sharedata[2],
//   // let N = sharedata[1]
//   try {
//     // Extract the shares
//     const shares = (_.isArray(sharesd)) ? sharesd : sharesd.data
//     const pass = secrets.combine(shares)
//       // convert back to str
//     const hpass = (pass).toString('hex')
//     return hpass
//   } catch (err) {
//     throw err
//   }
// }
