'use strict'
/**
 * index.js
 * Entry point for app execution
 ******************************/
// Electron

const {app, dialog} = require('electron')
// declare global constants
// MasterPass credentials global
global.creds = {}
// User settings global
global.settings = {}
// Paths global (only resolved at runtime)
global.paths = {
  mdb: `${app.getPath('userData')}/mdb`,
  userData: app.getPath('userData'),
  home: app.getPath('home'),
  documents: app.getPath('documents')
}

const logger = require('./script/logger')

// Core
const Db = require('./core/Db')
// Windows
const crypter = require('./src/crypter')
const masterPassPrompt = require('./src/masterPassPrompt')
const setup = require('./src/setup')
const settings = require('./src/settings')
const {ERRORS} = require('./config')
// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')()

// change exec path
logger.info(`AppPath: ${app.getAppPath()}`)
logger.info(`UseData Path: ${app.getPath('userData')}`)
process.chdir(app.getAppPath())
logger.info(`Changed cwd to: ${process.cwd()}`)
logger.info(`Electron v${process.versions.electron}`)
logger.info(`Electron node v${process.versions.node}`)

/**
 * Promisification of initialisation
 **/

const init = function () {
  return new Promise(function (resolve, reject) {
    // initialise mdb
    global.mdb = new Db(global.paths.mdb, function (mdb) {
      // Get the credentials serialized object from mdb
      resolve(mdb.get('creds'))
    })
  })
}

const initMain = function () {
  logger.verbose(`PROMISE: Main initialisation`)
  return new Promise(function (resolve, reject) {
    // restore the creds object globally
    resolve(global.mdb.restoreGlobalObj('creds'))
  })
}

/**
 * Event handlers
 **/

// Main event handler
app.on('ready', function () {
  // Check synchronously whether paths exist
  init()
    .then((mainRun) => {
      logger.info(`Init done.`)
      // If the credentials not find in mdb, run setup
      // otherwise run main
      if (mainRun) {
        // Run main
        logger.info(`Main run. Creating CrypterWindow...`)

        // Initialise (open mdb and get creds)
        initMain()
          .then(() => {
            // Obtain MasterPass, derive MasterPassKey and set globally
            return masterPassPromptWindow()
          })
          .then(() => {
            // Create the Crypter window and open it
            return crypterWindow()
          })
          .then(() => {
            // Quit app after crypterWindow is closed
            app.quit()
          })
          .catch(function (error) {
            if (error) {
              // Catch any fatal errors and exit
              logger.error(`PROMISE ERR: ${error.stack}`)
              dialog.showErrorBox(ERRORS.PROMISE, error.message)
            }
            app.quit()
          })
      } else {
        // Run Setup
        logger.info('Setup run. Creating Setup wizard...')

        setupWindow()
          .then(() => {
            logger.info('MAIN Setup successfully completed. quitting...')
            // setup successfully completed
            app.quit()
          })
          .catch(function (error) {
            logger.error(`PROMISE ERR: ${error.stack}`)
            // Display error to user
            dialog.showErrorBox(ERRORS.PROMISE, error.message)
            app.quit()
          })
      }
    })
    .catch(function (error) {
      logger.error(`PROMISE ERR: ${error.stack}`)
      // Display error to user
      dialog.showErrorBox(ERRORS.PROMISE, error.message)
      app.quit()
    })
})

/**
 * Electron events
 **/
let settingsWindowNotOpen = true

app.on('window-all-closed', () => {
  logger.verbose('APP: window-all-closed event emitted')
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
})

app.on('quit', () => {
  logger.info('APP: quit event emitted')
  global.mdb.close()
    .catch((err) => {
      console.error(err)
      throw err
    })
})

app.on('will-quit', (event) => {
  // will exit program once exit procedures have been run
  logger.info(`APP.ON('will-quit'): will-quit event emitted`)
  global.mdb.close()
    .catch((err) => {
      console.error(err)
      throw err
    })
})

/**
 * Custom events
 **/

app.on('app:quit', () => {
  logger.verbose('APP: app:quit event emitted')
  app.quit()
})

app.on('app:open-settings', () => {
  logger.verbose('APP: app:open-settings event emitted')
  // Check if not already opened
  if (settingsWindowNotOpen) {
    settingsWindowNotOpen = false
    settingsWindow()
      .then(() => {
        logger.verbose('APP: closed settingsWindow')
        // Closed so not open anymore
        settingsWindowNotOpen = true
      })
  }
})

app.on('app:check-updates', () => {
  logger.verbose('APP: app:check-updates event emitted')
  // Check for updates
})

app.on('app:relaunch', () => {
  logger.verbose('APP: app:relaunch event emitted')
  // Relaunch Crypter
  app.relaunch()
  // Exit successfully
  app.quit(0)
  // app.exit(0)
})

/**
 * Promisification of windows
 **/

// Creates the crypter window
let crypterWindow = function () {
  return new Promise(function (resolve, reject) {
    crypter.window(global, function () {
      resolve()
    })
  })
}

// Creates the setup window
let setupWindow = function () {
  return new Promise(function (resolve, reject) {
    setup.window(global, function (err) {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// Creates the MasterPassPrompt window
let masterPassPromptWindow = function () {
  return new Promise(function (resolve, reject) {
    masterPassPrompt.window(global, function (err, gotMP) {
      if (err || !gotMP) reject(err)
      resolve()
    })
  })
}

// Creates the settings window
let settingsWindow = function () {
  return new Promise(function (resolve, reject) {
    settings.window(global, function () {
      resolve()
    })
  })
}