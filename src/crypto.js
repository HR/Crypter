'use strict'
/**
 * crypto.js
 * Provides the crypto functionality required
 ******************************/

const secrets = require('secrets.js')
const fs = require('fs-extra')
const util = require('./util')
const path = require('path')
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
  return new Promise(function (resolve, reject) {
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
    // derive the encryption key
    exports.deriveKey(mpkey)
      .then((dcreds) => {
        // readstream to read the (unencrypted) file
        const origin = fs.createReadStream(origpath)
        // writestream to write (encrypted) file
        const dest = fs.createWriteStream(destpath)
        // generate a cryptographically secure random iv
        const iv = crypto.randomBytes(defaults.ivLength)
        // create the AES-256-GCM cipher with iv and derive encryption key
        const cipher = crypto.createCipheriv(defaults.algorithm, dcreds.key, iv)

        // Read file, apply tranformation (encryption) to stream and
        // then write stream to filesystem
        origin.pipe(cipher).pipe(dest)

        // readstream error handler
        origin.on('error', (err) => {
          // reject on readstream error
          reject(err)
        })

        // writestream error handler
        dest.on('error', (err) => {
          // reject on writestream
          reject(err)
        })

        // writestream finish handler
        dest.on('finish', () => {
          // get the generated Message Authentication Code
          const tag = cipher.getAuthTag()
          // return all the credentials and parameters used for encryption
          resolve({
            salt: dcreds.salt,
            key: dcreds.key,
            iv,
            tag
          })
        })
      })
      .catch((err) => {
         // reject if error occured while deriving key
         reject(err)
      })
  })
}

exports.deriveKey = function (pass, psalt) {
  return new Promise(function (resolve, reject) {
    // reject with error if pass not provided
    if (!pass) reject(new Error('Pass to derive key from not provided'))
    // If psalt is provided
    const salt = (psalt) ? ((psalt instanceof Buffer) ? psalt : new Buffer(psalt)) : crypto.randomBytes(defaults.keyLength)
    crypto.pbkdf2(pass, salt, defaults.mpk_iterations, defaults.keyLength, defaults.digest, (err, key) => {
      if (err) reject(err)
      resolve({key, salt})
    })
  })
}

// create a sha256 hash of the MasterPassKey
exports.genPassHash = function (masterpass, salt, callback) {
  return new Promise(function (resolve, reject) {
    const pass = (masterpass instanceof Buffer) ? masterpass.toString('hex') : masterpass

    if (salt) {
      const hash = crypto.createHash(defaults.hash_alg).update(`${pass}${salt}`).digest('hex')
      resolve({hash, key: masterpass})
    } else {
      const salt = crypto.randomBytes(defaults.keyLength).toString('hex')
      const hash = crypto.createHash(defaults.hash_alg).update(`${pass}${salt}`).digest('hex')
      resolve({hash, salt, key: masterpass})
    }
  })
}
