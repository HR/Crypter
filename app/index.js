'use strict'
/**
 * index.js
 * Entry point for app execution
 ******************************/

const { app, dialog, BrowserWindow } = require('electron'),
  packageJson = require('../package.json'),
  { openNewGitHubIssue, debugInfo } = require('electron-util'),
  debug = require('electron-debug'),
  unhandled = require('electron-unhandled')

unhandled({
  reportButton: error => {
    openNewGitHubIssue({
      user: 'HR',
      repo: 'Crypter',
      body: `\`\`\`\n${error.stack}\n\`\`\`\n\n---\n\n${debugInfo()}`
    })
  }
})
debug()
app.setAppUserModelId(packageJson.build.appId)

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

let fileToCrypt
let settingsWindowNotOpen = true

const logger = require('electron-log')
const { existsSync } = require('fs-extra')
const { checkUpdate } = require('./utils/update')
// Core
const Db = require('./core/Db')
const MasterPass = require('./core/MasterPass')
const MasterPassKey = require('./core/MasterPassKey')
// Windows
const crypter = require('./src/crypter')
const masterPassPrompt = require('./src/masterPassPrompt')
const setup = require('./src/setup')
const settings = require('./src/settings')
const { ERRORS } = require('./config')

// Debug info
logger.info(`Crypter v${app.getVersion()}`)
logger.info(`Process args: ${process.argv}`)
logger.info(`AppPath: ${app.getAppPath()}`)
logger.info(`UseData Path: ${app.getPath('userData')}`)
// Change exec path
process.chdir(app.getAppPath())
logger.info(`Changed cwd to: ${process.cwd()}`)
logger.info(`Electron v${process.versions.electron}`)
logger.info(`Electron node v${process.versions.node}`)
// Prevent second instance
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

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
  logger.verbose(`initialising Main...`)
  return global.mdb
    .restoreGlobalObj('creds')
    .then(() => MasterPass.init())
    .then(mpk => mpk && (global.MasterPassKey = new MasterPassKey(mpk.key)))
}

/**
 * Event handlers
 **/

// Main event handler
app.on('ready', function () {
  // Check for updates, silently
  checkUpdate().catch(err => {
    logger.warn(err)
  })
  // Check synchronously whether paths exist
  init()
    .then(mainRun => {
      logger.info(`Init done.`)
      // If the credentials not find in mdb, run setup
      // otherwise run main
      if (mainRun) {
        // Run main
        logger.info(`Main run. Creating CrypterWindow...`)

        // Initialise (open mdb and get creds)
        initMain()
          .then(mpLoaded => {
            logger.verbose(
              'INIT: MasterPass',
              mpLoaded ? 'loaded' : 'not saved'
            )
            // Obtain MasterPass, derive MasterPassKey and set globally
            return mpLoaded || createWindow(masterPassPrompt, false)
          })
          .then(() => {
            // Create the Crypter window and open it
            return createWindow(crypter, fileToCrypt)
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

        createWindow(setup)
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
app.on('will-finish-launching', () => {
  // Check if launched with a file (opened with app in macOS)
  app.on('open-file', (event, file) => {
    if (app.isReady() === false) {
      // Opening when not launched yet
      logger.info('Launching with open-file ' + file)
      fileToCrypt = file
    }
    event.preventDefault()
  })

  // Check if launched with a file (opened with app in Windows)
  if (
    process.argv[1] &&
    process.argv[1].length > 1 &&
    existsSync(process.argv[1])
  ) {
    fileToCrypt = process.argv[1]
  }
})

app.on('window-all-closed', () => {
  logger.verbose('APP: window-all-closed event emitted')
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
})

app.on('quit', () => {
  logger.info('APP: quit event emitted')
  global.mdb.close().catch(err => {
    console.error(err)
    throw err
  })
})

app.on('will-quit', event => {
  // will exit program once exit procedures have been run
  logger.info(`APP.ON('will-quit'): will-quit event emitted`)
  global.mdb.close().catch(err => {
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
  createWindow(settings)
})

app.on('app:check-update', () => {
  logger.verbose('APP: app:check-updates event emitted')
  // Check for updates
  checkUpdate()
    .then(updateAvailable => {
      if (!updateAvailable) {
        dialog.showMessageBox({
          type: 'info',
          message: 'No update available.',
          detail: `You have the latest version Crypter ${app.getVersion()} :)`
        })
      }
    })
    .catch(err => {
      logger.warn(err)
      dialog.showErrorBox(
        'Failed to check for update',
        `An error occured while checking for update:\n ${err.message}`
      )
    })
})

app.on('app:relaunch', () => {
  logger.verbose('APP: app:relaunch event emitted')
  // Relaunch Crypter
  app.relaunch()
  // Exit successfully
  app.quit(0)
  // app.exit(0)
})

app.on('app:reset-masterpass', () => {
  logger.verbose('APP: app:reset-masterpass event emitted')
  createWindow(masterPassPrompt)
})

/**
 * Promisification of windows
 **/

function createWindow (window, ...args) {
  const winInst = BrowserWindow.getAllWindows().find(
    win => win.getTitle() === window.title
  )
  // Focus on existing instance
  if (winInst) return winInst.focus()
  return new Promise((resolve, reject) =>
    window.window(global, ...args, err => {
      if (err) reject(err)
      resolve()
    })
  )
}
