'use strict'
/**
 * crypto.js
 * Provides the crypto functionality required
 ******************************/

const fs = require('fs-extra')
const path = require('path')
const scrypto = require('crypto')
const logger = require('../script/logger')
const Readable = require('stream').Readable
const zlib = require('zlib')
const through2 = require('through2')

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
        logger.info(JSON.stringify(creds))
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
  // Encrypts any arbitrary data passed with the pass
  return new Promise(function (resolve, reject) {
    // derive the encryption key
    exports.deriveKey(mpkey, null, defaults.iterations)
      .then((dcreds) => {
        let tag
        // readstream to read the (unencrypted) file
        const origin = fs.createReadStream(origpath)
        // create compressor
        // const zip = zlib.createGzip()
        // writestream to write (encrypted) file
        const dest = fs.createWriteStream(destpath)
        // generate a cryptographically secure random iv
        const iv = scrypto.randomBytes(defaults.ivLength)
        // create the AES-256-GCM cipher with iv and derive encryption key
        const cipher = scrypto.createCipheriv(defaults.algorithm, dcreds.key, iv)
        // create hash
        const hash = scrypto.createHash('sha1')
        hash.setEncoding('hex')

        cipher.on('readable', () => {
          var data = cipher.read()
          if (data)
            hash.update(data)
        })

        // Read file, apply tranformation (encryption) to stream and
        // then write stream to filesystem
        // origin.pipe(zip).pipe(cipher).pipe(dest, { end: false })
        origin.pipe(cipher).pipe(dest, { end: false })

        cipher.on('end', () => {
          logger.info(`Encrypted data hash digest ${hash.digest('hex')}`)
          // get the generated Message Authentication Code
          tag = cipher.getAuthTag()
          dest.write('\n')
          // Append iv used to encrypt the file to end of file
          // write in format Crypter#iv#authTag#salt
          dest.end(`Crypter#${iv.toString('hex')}#${tag.toString('hex')}#${dcreds.salt.toString('hex')}`)
          logger.warn(`Crypter#${iv.toString('hex')}#${tag.toString('hex')}#${dcreds.salt.toString('hex')}`)
        })

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
          // return all the credentials and parameters used for encryption
          resolve({
            salt: dcreds.salt,
            key: dcreds.key,
            tag,
            iv,
          })
        })
      })
      .catch((err) => {
        // reject if error occured while deriving key
        reject(err)
      })
  })
}
let readFile = function (path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, 'utf-8', function (err, data) {
      if (err) reject(err)
      resolve(data)
    })
  })
}

exports.decrypt = function (origpath, destpath, mpkey, iv, authTag) {
  // Decrypts any arbitrary data passed with the pass
  return new Promise(function (resolve, reject) {
    if (!iv || !authTag) {
      // extract from last line of file

      readFile(origpath).then((data) => {
        // let lines = data.trim().split('\n')
        let lines = data.split('\n')
        let lastLine = lines.slice(-1)[0]
        let fields = lastLine.split('#')
        logger.info(`lines: ${lines}, lastLine: ${lastLine}, fields: ${fields}`)

        if (fields[0] === 'Crypter') {
          const iv = new Buffer(fields[1], 'hex')
          const authTag = new Buffer(fields[2], 'hex')
          const salt = new Buffer(fields[3], 'hex')
          const mainData = lines.slice(0, -1).join('\n')
          // create mainData hash
          const hash = scrypto.createHash('sha1')
          hash.setEncoding('hex')
          hash.update(mainData)

          logger.info(`mainData: ${mainData}`)
          logger.info(`mainData hash digest ${hash.digest('hex')}`)

          // derive the original encryption key for the file
          exports.deriveKey(mpkey, salt, defaults.iterations)
            .then((dcreds) => {
              try {
                logger.info(`Derived encryption key ${dcreds.key.toString('hex')}`)
                let decipher = scrypto.createDecipheriv(defaults.algorithm, dcreds.key, iv)
                decipher.setAuthTag(authTag)
                logger.info(`authTag: ${authTag.toString('hex')}`)
                const dest = fs.createWriteStream(destpath)
                // const unzip = zlib.createGunzip()
                // let dec = decipher.update(mainData, 'utf8', 'utf8')
                // dec += decipher.final('utf8')
                // let origin = new Readable()
                // // read as stream
                // origin.push(dec)
                // origin.push(null)

                let origin = new Readable()
                // read as stream
                origin.push(mainData)
                origin.push(null)

                // origin.pipe(decipher).pipe(unzip).pipe(dest)
                origin.pipe(decipher).pipe(dest)

                decipher.on('error', (err) => {
                  reject(err)
                })

                origin.on('error', (err) => {
                  reject(err)
                })

                dest.on('error', (err) => {
                  reject(err)
                })

                dest.on('finish', () => {
                  logger.verbose(`Finished encrypted/written to ${destpath}`)
                  resolve({iv, authTag})
                })
              } catch (err) {
                reject(err)
              }
            })
        } else {
          reject(new Error('Not a Crypter file (can not get salt, iv and authTag)'))
        }
      }).catch((err) => {
        reject(err)
      })
    } else {
      // TODO: Implement normal flow
    }
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
