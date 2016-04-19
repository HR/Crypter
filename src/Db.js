'use strict'
/**
 * Db.js
 * Custom DB (levelup) API implementation
 ******************************/

const levelup = require('levelup')
const _ = require('lodash')
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
  return new Promise(function (resolve, reject) {
    // If object not empty then save it in db
    if (!(_.isEmpty(global[objName]))) {
      // stringify object and store as a string with objName as key
      self.put(objName, JSON.stringify(global[objName]), function (err) {
        if (err) {
          // I/O or other error, pass it up the callback
          reject(err)
        }
        resolve()
      })
    } else {
      // If object empty then do not save it
      resolve()
    }
  })
}

// restores a global object of a name (objName)
Db.prototype.restoreGlobalObj = function (objName) {
  const self = this
  return new Promise(function (resolve, reject) {
    self.get(objName, function (err, json) {
      if (err) {
        if (err.notFound) {
          reject(err)
        } else {
          // I/O or other error, pass it up the callback
          reject(err)
        }
      } else {
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
  return new Promise(function (resolve, reject) {
    self.get(key, function (err, value) {
      if (err) {
        if (err.notFound) {
          resolve(false)
        } else {
          // I/O or other error, pass it up the callback
          reject(err)
        }
      } else {
        resolve(value)
      }
    })
  })
}

module.exports = Db
