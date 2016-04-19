'use strict'
/**
 * crypto.js
 * Provides the crypto functionality required
 ******************************/

const secrets = require('secrets.js')
const fs = require('fs-extra')
const util = require('./util')
const path = require('path')
const _ = require('lodash')
const Readable = require('stream').Readable
const crypto = require('crypto')

// Crypto default constants
// TODO: change accordingly when changed in settings
let defaults = {
  iterations: 50000, // file encryption key derivation iterations
  keyLength: 32, // encryption key length
  ivLength: 12, // initialisation vector length
  algorithm: 'aes-256-gcm', // encryption algorithm
  digest: 'sha256', //
  hash_alg: 'sha256', // hashing algorithm
  check_hash_alg: 'md5',
  mpk_iterations: 100000, // MasterPassKey derivation iterations
  padLength: 1024, // 1 MB
  shares: 3,
  th: 2
}

exports.crypt = function (origpath, masterpass) {
  return new Promise(function(resolve, reject) {
    // the destination path for encrypted file
    let destpath = `${origpath}.crypto`
    exports.encrypt(origpath, destpath, masterpass)
      .then((creds) => {
          var file = {}
          file.name = path.basename(origpath)
          file.path = origpath
          file.cryptPath = destpath
          file.salt = creds.salt.toString('hex') // Convert salt used to derivekey to hex string
          file.key = creds.key.toString('hex') // Convert dervived key to hex string
          file.iv = creds.iv.toString('hex') // Convert iv to hex string
          file.authTag = creds.tag.toString('hex') // Convert authTag to hex string
          resolve(file)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

exports.encrypt = function (origpath, destpath, mpkey) {
  // decrypts any arbitrary data passed with the pass
  return new Promise(function (resolve, reject) {
    const salt = crypto.randomBytes(defaults.keyLength) // generate pseudorandom salt
    crypto.pbkdf2(mpkey, salt, defaults.iterations, defaults.keyLength, defaults.digest, (err, key) => {
      if (err) {
        // return error to callback YOLO#101
        reject(err)
      }
      const origin = fs.createReadStream(origpath)
      const dest = fs.createWriteStream(destpath)
      const iv = crypto.randomBytes(defaults.ivLength) // generate pseudorandom iv
      const cipher = crypto.createCipheriv(defaults.algorithm, key, iv)

      origin.pipe(cipher).pipe(dest)

      cipher.on('error', () => {
        reject(err)
      })

      origin.on('error', () => {
        reject(err)
      })

      dest.on('error', () => {
        reject(err)
      })

      dest.on('finish', () => {
        const tag = cipher.getAuthTag()
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

// exports.genIV = function () {
//   return new Promise(function (resolve, reject) {
//     try {
//       const iv = crypto.randomBytes(defaults.ivLength) // Synchronous gen
//       resolve(iv)
//     } catch (err) {
//       reject(err)
//     }
//   })
// }
//
// exports.genSalt = function () {
//   return new Promise(function (resolve, reject) {
//     try {
//       const salt = crypto.randomBytes(defaults.keyLength) // Synchronous gen
//       resolve(salt)
//     } catch (err) {
//       reject(err)
//     }
//   })
// }

exports.derivePassKey = function (pass, psalt) {
  return new Promise(function(resolve, reject) {
    if (!pass) reject(new Error('MasterPassKey not provided'))
      // If psalt is provided
    const salt = (psalt) ? ((psalt instanceof Buffer) ? psalt : new Buffer(psalt.data)) : crypto.randomBytes(defaults.keyLength)
    crypto.pbkdf2(pass, salt, defaults.mpk_iterations, defaults.keyLength, defaults.digest, (err, key) => {
      if (err) reject(err)

      resolve({key: key, salt: salt})
    })
  })
}

// create a sha256 hash of the MasterPassKey
exports.genPassHash = function (masterpass, salt, callback) {
  return new Promise(function(resolve, reject) {
    const pass = (masterpass instanceof Buffer) ? masterpass.toString('hex') : masterpass

    if (salt) {
      const hash = crypto.createHash(defaults.hash_alg).update(`${pass}${salt}`).digest('hex')
      resolve({hash: hash, key: masterpass})
    } else {
      const salt = crypto.randomBytes(defaults.keyLength).toString('hex')
      const hash = crypto.createHash(defaults.hash_alg).update(`${pass}${salt}`).digest('hex')
      resolve({hash: hash, salt: salt, key: masterpass})
    }
  })
}

// check if calculated hash is equal to stored hash
exports.verifyPassHash = function (mpkhash, gmpkhash) {
  return _.isEqual(mpkhash, gmpkhash)
}
