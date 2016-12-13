'use strict'
/**
 * Db.js
 * Custom JSON DB API implementation
 ******************************/

const _ = require('lodash')
const logger = require('winston')
const fs = require('fs-extra')
// const util = require('util')

/**
 * Constructor
 * An alias for the levelup constructor
 * @param {location}:string the location at which the Db to create or is at
 */

// Db class constructor
function Db (path, cb) {
  // If Db already exists at the path, it opens the Db
  // If no Db exists at the path, it creates a new Db

  // Set db path
  this.path = path
  // Save context to instance
  const self = this

  // Create db if does not exist
  fs.ensureFile(path, (err) => {
    if (err) {
      throw err
      return
    }
    // file has now been created or exists
    // either way, read the json now
    fs.readFile(path, (err, db) => {
      if (err) {
        throw err
        return
      }
      if (_.isEmpty(db)) {
        logger.verbose('db is empty so initialising it...')
        self._db = {}
        self.open = true
      } else {
        try {
          logger.verbose('db is not empty so json parsing it...')
          // Get original JSON object or create new if does not exist
          self._db = JSON.parse(db)
          self.open = true
        } catch (err) {
          throw err
          return
        }
      }
      // call callback with newly created object
      cb(self)
    })
  })
}

// Flush db to filesystem
Db.prototype.flush = function () {
  logger.verbose('flushing _db to fs')
  const self = this
  return new Promise((resolve, reject) => {
    fs.outputJson(self.path, self._db, (err) => {
      if (err) reject(err)
      // successfully flushed db to disk
      resolve()
    })
  })
}

// Add items to db
Db.prototype.put = function (key, value) {
  logger.verbose(`Putting ${key} in _db`)
  const self = this
  return new Promise((resolve, reject) => {
    // set value with key in the internal db
    self._db[key] = value
    // then flush db to fs
    self.flush()
      .then(() => {
        resolve()
      })
      .catch((err) => {
        reject(err)
      })
  })
}

// Get items from db
Db.prototype.get = function (key) {
  logger.verbose(`Getting ${key} from _db`)
  const self = this
  return new Promise((resolve, reject) => {
    // Return the object if it exists otherwise return false
    resolve(_.has(self._db, key) ? self._db[key] : false)
  })
}

Db.prototype.close = function () {
  logger.verbose(`Closing _db`)
  const self = this
  return new Promise((resolve, reject) => {
    // Check if db is open
    if (self.open) {
      self.flush()
        .then(() => {
          self.open = false
          resolve()
        })
        .catch((err) => {
          reject(err)
        })
    }
  })
}

// save a global object of a name (objName)
Db.prototype.saveGlobalObj = function (objName) {
  logger.verbose(`Saving global obj ${objName} to _db`)
  const self = this // get reference to the class instance
  return new Promise((resolve, reject) => {
    // If object not empty then save it in db
    if (!_.isEmpty(global[objName])) {
      // stringify object and store as a string with objName as key
      try {
        // wrap serialization of object around try catch as it could throw error
        const serializedObj = JSON.stringify(global[objName])
        self.put(objName, serializedObj)
          .then(() => {
            resolve()
          })
          .catch((err) => {
            reject(err) // db save error
          })
      } catch (err) {
        reject(err)
      }
    } else {
      // If object empty then do not save it
      resolve()
    }
  })
}

// restores a global object of a name (objName)
Db.prototype.restoreGlobalObj = function (objName) {
  logger.verbose(`Restoring global obj ${objName} from _db`)
  const self = this // get reference to th class instance
  return new Promise((resolve, reject) => {
    // get serialized object from db
    self.get(objName).then((serializedObj) => {
      try {
        // deserialize object and set as global
        global[objName] = JSON.parse(serializedObj) // try parsing JSON
        resolve()
      } catch (err) {
        // if error occurs while parsing, reject promise
        reject(err)
      }
    }).catch((err) => {
      // I/O or other error, pass it up the callback
      reject(err)
    })
  })
}

module.exports = Db
