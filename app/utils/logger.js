'use strict'
/**
 * logger.js
 * Custom logger for debugging
 ******************************/
const { createLogger, format, transports } = require('winston')
const { isRenderer } = require('./utils')

// const { app } = require('electron')
if (process.env.TEST_RUN || isRenderer()) {
  module.exports = createLogger({
    silent: true,
    exitOnError: false
  })
} else {
  const moment = require('moment')
  const fs = require('fs-extra')
  // const IN_DEV = !app.isPackaged
  let debugDir = `${global.paths.userData}/debug`
  fs.ensureDirSync(debugDir)
  const fileTransport = new transports.File({
    filename: `${debugDir}/CS_debug_${moment().format('DD.MM@HH:MM').trim()}.log`,
    handleExceptions: true,
    colorize: false,
    level: 'verbose'
  })

  const logFormat = format.combine(
    format.colorize(),
    format.timestamp(),
    format.prettyPrint(),
    format.align(),
    format.splat(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  )

  const logger = createLogger({
    transports: [
      new transports.Console(),
      fileTransport
    ],
    exitOnError: false,
    format: logFormat,
    level: 'verbose'
  })

  module.exports = logger
}