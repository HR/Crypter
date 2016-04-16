'use strict'
/**
 * Db.js
 * Custom DB (levelup) API implementation
 ******************************/

const levelup = require('levelup')
const _ = require('lodash')
const logger = require('../script/logger')
const util = require('util')

/**
 * Constructor
 * An alias for the levelup constructor
 * @param {location}:string the location at which the Db to create or is at
 */

function Db (location) {
  // If levelup Db already exists at the location, it opens the Db
  // If no levelup Db exists at the location, it creates a new Db
  // Calls the levelup constructor
  levelup.call(this, location)
}

// Inherit all properties and methods from levelup superclass
util.inherits(Db, levelup)

// save a global object of a name (objName)
Db.prototype.saveGlobalObj = function (objName) {
  const self = this
  // logger.verbose(`PROMISE: saveGlobalObj for ${objName}`)
  return new Promise(function (resolve, reject) {
    // If object not empty then save it in db
    if (!(_.isEmpty(global[objName]))) {
      // stringify object and store as a string with objName as key
      self.put(objName, JSON.stringify(global[objName]), function (err) {
        if (err) {
          logger.verbose(`ERROR: mdb.put('${objName}') failed, ${err}`)
          // I/O or other error, pass it up the callback
          reject(err)
        }
        // logger.verbose(`SUCCESS: mdb.put('${objName}')`)
        resolve()
      })
    } else {
      // If object empty then do not save it
      // logger.verbose('Nothing to save; empty.')
      resolve()
    }
  })
}

// restores a global object of a name (objName)
Db.prototype.restoreGlobalObj = function (objName) {
  const self = this
  // logger.verbose(`PROMISE: restoreGlobalObj for ${objName}`)
  return new Promise(function (resolve, reject) {
    self.get(objName, function (err, json) {
      if (err) {
        if (err.notFound) {
          logger.verbose(`ERROR: Global obj ${objName} NOT FOUND `)
          reject(err)
        } else {
          // I/O or other error, pass it up the callback
          logger.verbose(`ERROR: mdb.get('${objName}') FAILED`)
          reject(err)
        }
      } else {
        // logger.verbose(`SUCCESS: ${objName} FOUND`)
        try {
          global[objName] = JSON.parse(json) || {}
          resolve()
        } catch (e) {
          return e
        }
      }
    })
  })
}

// Only get value for a key from Db if it exists otherwise return null
Db.prototype.onlyGetValue = function (key) {
  const self = this
  logger.verbose(`PROMISE: getValue for getting ${key}`)
  return new Promise(function (resolve, reject) {
    self.get(key, function (err, value) {
      if (err) {
        if (err.notFound) {
          logger.verbose(`ERROR: key ${key} NOT FOUND `)
          resolve(false)
        } else {
          // I/O or other error, pass it up the callback
          logger.verbose(`ERROR: mdb.get('${key}') FAILED`)
          reject(err)
        }
      } else {
        logger.verbose(`SUCCESS: ${key} FOUND`)
        resolve(value)
      }
    })
  })
}

module.exports = Db
