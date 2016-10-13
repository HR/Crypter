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
const tar = require('tar-fs')
const CRYPTER_REGEX = /^Crypter(.*)$/igm

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
    exports.encrypt(origpath, masterpass)
      .then((creds) => {
        logger.info(`Encrypt creds: ${JSON.stringify(creds)}`)
        resolve({
          op: 'Encrypted', // Crypter operation
          name: path.basename(origpath), // filename
          path: origpath, // path of the (unencrypted) file
          cryptPath: creds.cryptpath, // path of the encrypted file
          salt: creds.salt.toString('hex'), // salt used to derivekey in hex
          key: creds.key.toString('hex'), // dervived key in hex
          iv: creds.iv.toString('hex'), // iv in hex
          authTag: creds.tag.toString('hex') // authTag in hex
        })
      })
      .catch((err) => {
        reject(err)
      })
  })
}

exports.encrypt = function (origpath, mpkey) {
  // Encrypts any arbitrary data passed with the pass
  return new Promise(function (resolve, reject) {
    // derive the encryption key
    exports.deriveKey(mpkey, null, defaults.iterations)
      .then((dcreds) => {
        let tag
        let dname = '.crypting'
        let tempd = `${path.dirname(origpath)}/${dname}`
        let dataDestPath = `${tempd}/data`
        let credsDestPath = `${tempd}/creds`
        logger.verbose(`tempd: ${tempd}, dataDestPath: ${dataDestPath}, credsDestPath: ${credsDestPath}`)
        // create tempd temporary directory
        fs.mkdirs(tempd, function (err) {
          if (err)
            reject(err)
          logger.info(`Created ${tempd} successfully`)
          // readstream to read the (unencrypted) file
          const origin = fs.createReadStream(origpath)
          // create data and creds file
          const dataDest = fs.createWriteStream(dataDestPath)
          const credsDest = fs.createWriteStream(credsDestPath)
          // generate a cryptographically secure random iv
          const iv = scrypto.randomBytes(defaults.ivLength)
          // create the AES-256-GCM cipher with iv and derive encryption key
          const cipher = scrypto.createCipheriv(defaults.algorithm, dcreds.key, iv)

          // Read file, apply tranformation (encryption) to stream and
          // then write stream to filesystem
          // origin.pipe(zip).pipe(cipher).pipe(dest, { end: false })
          origin.pipe(cipher).pipe(dataDest)

          cipher.on('end', () => {
            // get the generated Message Authentication Code
            tag = cipher.getAuthTag()
            // Write crdentials used to encrypt in creds file
            // write in format Crypter#iv#authTag#salt
            credsDest.end(`Crypter#${iv.toString('hex')}#${tag.toString('hex')}#${dcreds.salt.toString('hex')}`)
          })

          // readstream error handler
          origin.on('error', (err) => {
            // reject on readstream error
            reject(err)
          })

          // writestream error handler
          dataDest.on('error', (err) => {
            // reject on writestream
            reject(err)
          })

          credsDest.on('error', (err) => {
            // reject on writestream
            reject(err)
          })

          // writestream finish handler
          credsDest.on('finish', () => {
            let tarDestPath = `${origpath}.crypto`
            const tarDest = fs.createWriteStream(tarDestPath)
            // Pack directory and zip into a .crypto file
            tar.pack(tempd).pipe(tarDest)
            tarDest.on('error', (err) => {
              // reject on writestream
              reject(err)
            })
            tarDest.on('finish', () => {
              // Remove temporary dir tempd
              fs.remove(tempd, function (err) {
                if (err)
                  reject(err)
                // return all the credentials and parameters used for encryption
                logger.info('Successfully deleted tempd!')
                resolve({
                  salt: dcreds.salt,
                  key: dcreds.key,
                  cryptpath: tarDestPath,
                  tag: tag,
                  iv: iv
                })
              })
            })
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

exports.decrypt = function (origpath, mpkey) {
  // Decrypts a crypto format file passed with the pass
  return new Promise(function (resolve, reject) {
    // Extract a directory
    let dname = '.decrypting'
    let tempd = `${path.dirname(origpath)}/${dname}`
    let dataOrigPath = `${tempd}/data`
    let credsOrigPath = `${tempd}/creds`
    let dataDestPath = origpath.replace('.crypto', '')
    dataDestPath = dataDestPath.replace(path.basename(dataDestPath), `Decrypted ${path.basename(dataDestPath)}`)
    let tarOrig = fs.createReadStream(origpath)
    let tarExtr = tar.extract(tempd)
    // Extract tar to dname directory
    tarOrig.pipe(tarExtr)

    tarOrig.on('error', (err) => {
      // reject on writestream
      reject(err)
    })
    tarExtr.on('finish', () => {
      // Now read creds and use to decrypt data
      logger.verbose('Finished extracting')

      readFile(credsOrigPath)
        .then((credsLines) => {
          let credsLine = credsLines.trim().match(CRYPTER_REGEX)

          if (credsLine) {
            let creds = credsLine[0].split('#')
            logger.verbose(`creds: ${creds}, credsLine: ${credsLine}`)

            const iv = new Buffer(creds[1], 'hex')
            const authTag = new Buffer(creds[2], 'hex')
            const salt = new Buffer(creds[3], 'hex')
            logger.info(`iv: ${iv}, authTag: ${authTag}, salt: ${salt}`)
            // Read encrypted data stream
            const dataOrig = fs.createReadStream(dataOrigPath)
            // derive the original encryption key for the file
            exports.deriveKey(mpkey, salt, defaults.iterations)
              .then((dcreds) => {
                try {
                  logger.info(`Derived encryption key ${dcreds.key.toString('hex')}`)
                  let decipher = scrypto.createDecipheriv(defaults.algorithm, dcreds.key, iv)
                  decipher.setAuthTag(authTag)
                  logger.info(`authTag: ${authTag.toString('hex')}`)
                  const dataDest = fs.createWriteStream(dataDestPath)
                  dataOrig.pipe(decipher).pipe(dataDest)

                  decipher.on('error', (err) => {
                    reject(err)
                  })

                  dataOrig.on('error', (err) => {
                    reject(err)
                  })

                  dataDest.on('error', (err) => {
                    reject(err)
                  })

                  dataDest.on('finish', () => {
                    logger.verbose(`Encrypted to ${dataDestPath}`)
                    // Now delete tempd (temporary directory)
                    fs.remove(tempd, function (err) {
                      if (err)
                        reject(err)
                      logger.verbose(`Removed temp dir ${tempd}`)
                      resolve({
                        op: 'Decrypted',
                        name: path.basename(origpath),
                        path: origpath,
                        cryptPath: dataDestPath,
                        salt: salt.toString('hex'),
                        key: dcreds.key.toString('hex'),
                        iv: iv.toString('hex'),
                        authTag: authTag.toString('hex')
                      })
                    })
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
