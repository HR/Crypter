'use strict'
/**
 * crypto.js
 * Provides the crypto functionality required
 ******************************/

const fs = require('fs-extra')
const path = require('path')
const Readable = require('stream').Readable
const scrypto = require('crypto')

// Crypto default constants
let defaults = {
  iterations: 50000, // file encryption key derivation iterations
  keyLength: 32, // encryption key length
  ivLength: 12, // initialisation vector length
  algorithm: 'aes-256-gcm', // encryption algorithm
  digest: 'sha256', // digest function
  hash_alg: 'sha256', // hashing function
  mpk_iterations: 100000 // MasterPassKey derivation iterations
}

exports.crypt = function (origpath, masterpass) {
  return new Promise(function (resolve, reject) {
    // Resolve the destination path for encrypted file
    let destpath = `${origpath}.crypto`
    exports.encrypt(origpath, destpath, masterpass)
      .then((creds) => {
        // create the file object
        var file = {}
        // extract file name from path
        file.name = path.basename(origpath)
        // Save the path of the (unencrypted) file
        file.path = origpath
        // Save the path of the encrypted file
        file.cryptPath = destpath
        // Convert salt used to derivekey to hex string
        file.salt = creds.salt.toString('hex')
        // Convert dervived key to hex string
        file.key = creds.key.toString('hex')
        // Convert iv to hex string
        file.iv = creds.iv.toString('hex')
        // Convert authTag to hex string
        file.authTag = creds.tag.toString('hex')
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
    exports.deriveKey(mpkey, null, defaults.iterations)
      .then((dcreds) => {
        // readstream to read the (unencrypted) file
        const origin = fs.createReadStream(origpath)
        // writestream to write (encrypted) file
        const dest = fs.createWriteStream(destpath)
        // generate a cryptographically secure random iv
        const iv = scrypto.randomBytes(defaults.ivLength)
        // create the AES-256-GCM cipher with iv and derive encryption key
        const cipher = scrypto.createCipheriv(defaults.algorithm, dcreds.key, iv)

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

exports.deriveKey = function (pass, psalt, iterations = defaults.mpk_iterations) {
  return new Promise(function (resolve, reject) {
    // reject with error if pass not provided
    if (!pass) reject(new Error('Pass to derive key from not provided'))

    // If psalt is provided and is a Buffer then assign it
    // If psalt is provided and is not a Buffer then coerce it and assign it
    // If psalt is not provided then generate a cryptographically secure salt
    // and assign it
    const salt = (psalt)
      ? ((psalt instanceof Buffer)
        ? psalt
        : new Buffer(psalt))
      : scrypto.randomBytes(defaults.keyLength)

    // derive the key using the salt, password and default crypto setup
    scrypto.pbkdf2(pass, salt, iterations, defaults.keyLength, defaults.digest, (err, key) => {
      if (err) reject(err)
      // return the key and the salt
      resolve({key, salt})
    })
  })
}

// create a sha256 hash of the MasterPassKey
exports.genPassHash = function (masterpass, salt) {
  return new Promise(function (resolve, reject) {
    // convert the masterpass (of type Buffer) to a hex encoded string
    // if it is not already one
    const pass = (masterpass instanceof Buffer) ? masterpass.toString('hex') : masterpass

    // if salt provided then the MasterPass is being checked
    // if salt not provided then the MasterPass is being set
    if (salt) {
      // create hash from the contanation of the pass and salt
      // assign the hex digest of the created hash
      const hash = scrypto.createHash(defaults.hash_alg).update(`${pass}${salt}`).digest('hex')
      resolve({hash, key: masterpass})
    } else {
      // generate a cryptographically secure salt and use it as the salt
      const salt = scrypto.randomBytes(defaults.keyLength).toString('hex')
      // create hash from the contanation of the pass and salt
      // assign the hex digest of the created hash
      const hash = scrypto.createHash(defaults.hash_alg).update(`${pass}${salt}`).digest('hex')
      resolve({hash, salt, key: masterpass})
    }
  })
}
