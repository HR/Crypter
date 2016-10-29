'use strict'
/**
 * logger.js
 * Custom logger for debugging
 ******************************/
const winston = require('winston')
const moment = require('moment')
const fs = require('fs-extra')

let debugDir = `${global.paths.userData}/debug`
fs.ensureDirSync(debugDir)
winston.emitErrs = true
const fileTransport = new (winston.transports.File)({
  filename: `${debugDir}/CS_debug_${moment().format('DD.MM@HH:MM').trim()}.log`,
  handleExceptions: true,
  maxsize: 5242880, // 5MB
  colorize: false,
  level: 'verbose'
})

module.exports = (!process.env.TEST_RUN) ? new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: 'debug',
      handleExceptions: true,
      // timestamp: true,
      json: false,
      colorize: true
    }),
    fileTransport
  ],
  exitOnError: false
}) : new (winston.Logger)({
  transports: [
    fileTransport
  ],
  exitOnError: false
})
