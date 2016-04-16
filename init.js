'use strict'
/**
 * init.js
 * Initialisers
 ******************************/
const _ = require('lodash')
const fs = require('fs-extra')
const logger = require('./script/logger')
const Db = require('./src/Db')

exports.main = function () {
  // Decrypt db (the Vault) and get ready for use
  // open mdb
  logger.verbose(`PROMISE: Main initialisation`)
  return new Promise(function (resolve, reject) {
    global.mdb.restoreGlobalObj('creds')
      .then(() => {
        resolve()
      })
      .catch((err) => {
        reject(err)
      })
  })
}

exports.setup = function () {
  logger.verbose(`PROMISE: Setup initialisation`)
  return new Promise(function (resolve, reject) {
  })
}
