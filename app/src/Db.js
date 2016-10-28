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

// Db class constructor
function Db (path) {
  // If levelup Db already exists at the path, it opens the Db
  // If no levelup Db exists at the path, it creates a new Db
  // Calls the levelup constructor
  // this refers to the Db instance
  levelup.call(this, path)
}

// Inherit all properties and methods from levelup superclass
util.inherits(Db, levelup)

// save a global object of a name (objName)
Db.prototype.saveGlobalObj = function (objName) {
  const self = this // get reference to the class instance
  return new Promise(function (resolve, reject) {
    // If object not empty then save it in db
    if (!(_.isEmpty(global[objName]))) {
      // stringify object and store as a string with objName as key
      try {
        // wrap serialization of object around try catch as it could throw error
        const serializedObj = JSON.stringify(global[objName])
        self.put(objName, serializedObj, function (err) {
          if (err) reject(err) // db save error
          resolve()
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
  const self = this // get reference to th class instance
  return new Promise(function (resolve, reject) {
    // get serialized object from db
    self.get(objName, function (err, serializedObj) {
      if (err) {
        // I/O or other error, pass it up the callback
        reject(err)
      } else {
        try {
          // deserialize object and set as global
          global[objName] = JSON.parse(serializedObj) // try parsing JSON
          resolve()
        } catch (err) {
          // if error occurs while parsing, reject promise
          reject(err)
        }
      }
    })
  })
}

// Only get value for a key from Db if it exists otherwise return null
Db.prototype.onlyGetValue = function (key) {
  const self = this // get reference to the class instance
  return new Promise(function (resolve, reject) {
    self.get(key, function (err, value) { // get value of key from db
      if (err) {
        if (err.notFound) {
          // if key not found in the db then resolve with false
          resolve(false)
        } else {
          // I/O or other error, reject it with the error
          reject(err)
        }
      } else {
        // resolve with found key
        resolve(value)
      }
    })
  })
}

module.exports = Db
