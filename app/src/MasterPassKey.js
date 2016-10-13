'use strict'
/**
 * MasterPass.js
 * Provides a way to securely set and retrieve the MasterPass globally
 * MasterPassKey is protected (private var) and only exist in Main memory
 ******************************/

 // Uses closure to securely store MasterPassKey in MasterPassKey object
const MasterPassKey = (function () {
  // Private mpk variable that stores the MasterPassKey
  const mpk = new WeakMap()

  // Class constructor
  function MasterPassKey (key) {
    // Initialise the new instance of class with the MasterPassKey
    mpk.set(this, key)
  }

  // Public get method the for mpk
  MasterPassKey.prototype.get = function () {
    if (mpk.get(this) === undefined) {
      // If MasterPassKey not set or delected
      return new Error('MasterPassKey is not set')
    } else {
      // If MasterPassKey is set then return it
      return mpk.get(this)
    }
  }

  // Public set method the for mpk
  MasterPassKey.prototype.set = function (key) {
    if (key instanceof Buffer) {
      // If the key is a Buffer then set it
      mpk.set(this, key)
    } else {
      // If the key is not a Buffer return an erro
      return new Error('MasterPassKey not a Buffer')
    }
  }

  // Delete the MasterPassKey
  MasterPassKey.prototype.delete = function (key) {
    mpk.delete(this)
  }

  return MasterPassKey
}())

module.exports = MasterPassKey
