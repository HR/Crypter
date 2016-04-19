'use strict'
/**
 * init.js
 * Initialisers
 ******************************/
const _ = require('lodash')
const logger = require('./script/logger')
const Db = require('./src/Db')

exports.run = function () {
  return new Promise(function(resolve, reject) {
    // initialise mdb
    global.mdb = new Db(global.paths.mdb)
    // Get the credentials serialized object from mdb
    // Resolves with false if not found
    resolve(global.mdb.onlyGetValue('creds'))
  })
}

exports.main = function () {
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
