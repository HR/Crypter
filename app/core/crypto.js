'use strict'
/**
 * crypto.js
 * Provides the crypto functionality required
 ******************************/

const fs = require('fs-extra')
const path = require('path')
const scrypto = require('crypto')
const logger = require('winston')
const Readable = require('stream').Readable
const tar = require('tar-fs')
const {CRYPTO, REGEX, ERRORS} = require('../config')

// Helper functions

let readFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })
}

// Exports

exports.crypt = (origpath, masterpass) => {
  return new Promise((resolve, reject) => {
    // Resolve the destination path for encrypted file
    exports.encrypt(origpath, masterpass)
      .then((creds) => {
        resolve({
          op: CRYPTO.ENCRYPT_OP, // Crypter operation
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

exports.encrypt = (origpath, mpkey) => {
  // Encrypts any arbitrary data passed with the pass
  return new Promise((resolve, reject) => {
    // derive the encryption key
    exports.deriveKey(mpkey, null, CRYPTO.DEFAULTS.ITERATIONS)
      .then((dcreds) => {
        let tag
        let tempd = `${path.dirname(origpath)}/${CRYPTO.ENCRYPTION_TMP_DIR}`
        let dataDestPath = `${tempd}/data`
        let credsDestPath = `${tempd}/creds`
        logger.verbose(`tempd: ${tempd}, dataDestPath: ${dataDestPath}, credsDestPath: ${credsDestPath}`)
        // create tempd temporary directory
        fs.mkdirs(tempd, (err) => {
          if (err)
            reject(err)
          logger.verbose(`Created ${tempd} successfully`)
          // readstream to read the (unencrypted) file
          const origin = fs.createReadStream(origpath)
          // create data and creds file
          const dataDest = fs.createWriteStream(dataDestPath)
          const credsDest = fs.createWriteStream(credsDestPath)
          // generate a cryptographically secure random iv
          const iv = scrypto.randomBytes(CRYPTO.DEFAULTS.IVLENGTH)
          // create the AES-256-GCM cipher with iv and derive encryption key
          const cipher = scrypto.createCipheriv(CRYPTO.DEFAULTS.ALGORITHM, dcreds.key, iv)

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
            let tarDestPath = origpath + CRYPTO.EXT
            const tarDest = fs.createWriteStream(tarDestPath)
            const tarPack = tar.pack(tempd)
            // Pack directory and zip into a .crypto file
            tarPack.pipe(tarDest)

            tarDest.on('error', (err) => {
              // reject on writestream
              reject(err)
            })

            tarPack.on('error', (err) => {
              // reject on writestream
              reject(err)
            })

            tarDest.on('finish', () => {
              // Remove temporary dir tempd
              fs.remove(tempd, (err) => {
                if (err) reject(err)
                // return all the credentials and parameters used for encryption
                logger.verbose('Successfully deleted tempd!')
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

exports.decrypt = (origpath, mpkey) => {
  // Decrypts a crypto format file passed with the pass
  return new Promise((resolve, reject) => {
    // Extract a directory
    let tempd = `${path.dirname(origpath)}/${CRYPTO.DECRYPTION_TMP_DIR}`
    let dataOrigPath = `${tempd}/${CRYPTO.FILE_DATA}`
    let credsOrigPath = `${tempd}/${CRYPTO.FILE_CREDS}`
    let dataDestPath = origpath.replace(CRYPTO.EXT, '')
    dataDestPath = dataDestPath.replace(path.basename(dataDestPath), CRYPTO.DECRYPT_TITLE_PREPEND + path.basename(dataDestPath))
    let tarOrig = fs.createReadStream(origpath)
    let tarExtr = tar.extract(tempd)
    // Extract tar to CRYPTO.DECRYPTION_TMP_DIR directory
    tarOrig.pipe(tarExtr)

    tarOrig.on('error', (err) => {
      // reject on writestream
      reject(err)
    })

    tarExtr.on('error', (err) => {
      // reject on extraction error
      reject(err)
    })

    tarExtr.on('finish', () => {
      // Now read creds and use to decrypt data
      logger.verbose('Finished extracting')

      readFile(credsOrigPath)
        .then((credsLines) => {
          let credsLine = credsLines.trim().match(REGEX.ENCRYPTION_CREDS)

          if (credsLine) {
            let creds = credsLine[0].split('#')
            logger.verbose(`creds: ${creds}, credsLine: ${credsLine}`)

            const iv = new Buffer(creds[1], 'hex')
            const authTag = new Buffer(creds[2], 'hex')
            const salt = new Buffer(creds[3], 'hex')
            logger.verbose(`Extracted data, iv: ${iv}, authTag: ${authTag}, salt: ${salt}`)
            // Read encrypted data stream
            const dataOrig = fs.createReadStream(dataOrigPath)
            // derive the original encryption key for the file
            exports.deriveKey(mpkey, salt, CRYPTO.DEFAULTS.ITERATIONS)
              .then((dcreds) => {
                try {
                  let decipher = scrypto.createDecipheriv(CRYPTO.DEFAULTS.ALGORITHM, dcreds.key, iv)
                  decipher.setAuthTag(authTag)
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
                    fs.remove(tempd, (err) => {
                      if (err)
                        reject(err)
                      logger.verbose(`Removed temp dir ${tempd}`)
                      resolve({
                        op: CRYPTO.DECRYPT_OP,
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
            reject(new Error(ERRORS.DECRYPT))
          }
        }).catch((err) => {
        reject(err)
      })
    })
  })
}

exports.deriveKey = (pass, psalt) => {
  return new Promise((resolve, reject) => {
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
      : scrypto.randomBytes(CRYPTO.DEFAULTS.KEYLENGTH)

    // derive the key using the salt, password and default crypto setup
    scrypto.pbkdf2(pass, salt, CRYPTO.DEFAULTS.MPK_ITERATIONS, CRYPTO.DEFAULTS.KEYLENGTH, CRYPTO.DEFAULTS.DIGEST, (err, key) => {
      if (err) reject(err)
      // return the key and the salt
      resolve({key, salt})
    })
  })
}

// create a sha256 hash of the MasterPassKey
exports.genPassHash = (masterpass, salt) => {
  return new Promise((resolve, reject) => {
    // convert the masterpass (of type Buffer) to a hex encoded string
    // if it is not already one
    const pass = (masterpass instanceof Buffer) ? masterpass.toString('hex') : masterpass

    // if salt provided then the MasterPass is being checked
    // if salt not provided then the MasterPass is being set
    if (salt) {
      // create hash from the contanation of the pass and salt
      // assign the hex digest of the created hash
      const hash = scrypto.createHash(CRYPTO.DEFAULTS.HASH_ALG).update(`${pass}${salt}`).digest('hex')
      resolve({hash, key: masterpass})
    } else {
      // generate a cryptographically secure salt and use it as the salt
      const salt = scrypto.randomBytes(CRYPTO.DEFAULTS.KEYLENGTH).toString('hex')
      // create hash from the contanation of the pass and salt
      // assign the hex digest of the created hash
      const hash = scrypto.createHash(CRYPTO.DEFAULTS.HASH_ALG).update(`${pass}${salt}`).digest('hex')
      resolve({hash, salt, key: masterpass})
    }
  })
}

// Convert array string of buffer to hex string
exports.buf2hex = (arr) => {
  const buf = new Buffer(arr)
  return buf.toString('hex')
}
