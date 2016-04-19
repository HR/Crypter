'use strict'
/**
 * MasterPass.js
 * Provides a way to securely set and retrieve the MasterPass globally
 * MasterPassKey is protected (private var) and only exist in Main memory
 * MasterPassKey is a derived key of the actual user MasterPass
 ******************************/

const MasterPassKey = (function () {
  const mpk = new WeakMap()

  function MasterPassKey (key) {
    mpk.set(this, key)
  }

  MasterPassKey.prototype.get = function () {
    if (mpk.get(this) === undefined) {
      return new Error('MasterPassKey is not set')
    } else {
      return mpk.get(this)
    }
  }

  MasterPassKey.prototype.set = function (key) {
    if (key instanceof Buffer) {
      mpk.set(this, key)
    } else {
      return new Error('MasterPassKey not a Buffer')
    }
  }

  MasterPassKey.prototype.delete = function (key) {
    mpk.delete(this)
  }

  return MasterPassKey
}())

module.exports = MasterPassKey
