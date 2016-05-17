'use strict'
const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipc = electron.ipcMain
const dialog = electron.dialog
const crypto = require('./src/crypto')
const Db = require('./src/Db')
const MasterPass = require('./src/MasterPass')
const MasterPassKey = require('./src/MasterPassKey')
const _ = require('lodash')
const logger = require('./script/logger')
// change exec path
logger.info(`AppPath: ${app.getAppPath()}`)
process.chdir(app.getAppPath())
logger.info(`Changed cwd to: ${process.cwd()}`)

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')()

// declare global constants
global.creds = {}
global.paths = {
  mdb: `${app.getPath('userData')}/mdb`,
  userData: app.getPath('userData'),
  home: app.getPath('home'),
  documents: app.getPath('documents')
}
global.views = {
  masterpassprompt: `file://${__dirname}/static/masterpassprompt.html`,
  setup: `file://${__dirname}/static/setup.html`,
  crypter: `file://${__dirname}/static/crypter.html`
}

/**
 * Promisification of initialisation
 **/

const init = function () {
  return new Promise(function (resolve, reject) {
    // initialise mdb
    global.mdb = new Db(global.paths.mdb)
    // Get the credentials serialized object from mdb
    // Resolves with false if not found
    resolve(global.mdb.onlyGetValue('creds'))
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
      // If the credentials not find in mdb, run setup
      // otherwise run main
      if (mainRun) {
        // Run main
        logger.info('Main run. Creating CrypterWindow...')

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
            // Catch any fatal errors and exit
            logger.error(`PROMISE ERR: ${error.stack}`)
            //  dialog.showErrorBox('Oops, we encountered a problem...', error.message)
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
            //  dialog.showErrorBox('Oops, we encountered a problem...', error.message)
            app.quit()
          })
      }
    })
    .catch(function (error) {
      logger.error(`PROMISE ERR: ${error.stack}`)
      // Display error to user
      // dialog.showErrorBox('Oops, we encountered a problem...', error.message)
      app.quit()
    })
})

app.on('window-all-closed', () => {
  logger.verbose('APP: window-all-closed event emitted')
})

app.on('quit', () => {
  logger.info('APP: quit event emitted')
})

app.on('will-quit', (event) => {
  // will exit program once exit procedures have been run (exit flag is true)
  logger.info(`APP.ON('will-quit'): will-quit event emitted`)
  if (!_.isEmpty(global.mdb)) {
    // close mdb before quitting if opened
    global.mdb.close()
  }
})

/**
 * Promisification of windows
 **/

// Creates the crypter window
let crypterWindow = function () {
  return new Promise(function (resolve, reject) {
    CrypterWindow(function () {
      resolve()
    })
  })
}

// Creates the setup window
let setupWindow = function () {
  return new Promise(function (resolve, reject) {
    SetupWindow(function (err) {
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
    MasterPassPromptWindow(function (err, gotMP) {
      if (err) reject(err)
      if (gotMP) {
        resolve()
      } else {
        reject(new Error('Could not get MasterPass'))
      }
    })
  })
}

/**
 * Controller functions (windows)
 **/

function CrypterWindow (callback) {
  // creates a new BrowserWindow
  let win = new BrowserWindow({
    width: 350,
    height: 450,
    center: true,
    titleBarStyle: 'hidden-inset',
    resizable: false
  })

  let webContents = win.webContents

  // loads crypt.html view into the BrowserWindow
  win.loadURL(global.views.crypter)

  // When user selects a file to encrypt in Crypter window
  ipc.on('cryptFile', function (event, filePath) {
    logger.verbose('IPCMAIN: cryptFile emitted. Starting encryption...')
    crypto.crypt(filePath, global.MasterPassKey.get())
      .then((file) => {
        webContents.send('cryptedFile', file)
      })
      .catch((err) => {
        logger.error(err)
        webContents.send('cryptErr', err)
      })
  })

  // When user selects a file to decrypt in Crypter window
  ipc.on('decryptFile', function (event, filePath) {
    logger.verbose('IPCMAIN: cryptFile emitted. Starting encryption...')
    let destPath = filePath.replace('.crypto', '.decrypto')
    crypto.decrypt(filePath, destPath, global.MasterPassKey.get())
      .then((creds) => {
        logger.info('decrypted')
        return
        // webContents.send('decryptedFile', file)
      })
      .catch((err) => {
        logger.error(err)
        webContents.send('cryptErr', err)
      })
  })

  win.on('closed', function () {
    logger.info('win.closed event emitted for PromptWindow')
    win = null
    callback()
  })

  return win
}

function SetupWindow (callback) {
  // setup view controller

  // creates the setup window
  let win = new BrowserWindow({
    width: 600,
    height: 400,
    center: true,
    show: true,
    titleBarStyle: 'hidden-inset',
    resizable: false
  })

  let webContents = win.webContents
  let error
  // loads setup.html view into the SetupWindow
  win.loadURL(global.views.setup)

  ipc.on('setMasterPass', function (event, masterpass) {
    // setMasterPass event triggered by render proces
    logger.verbose('IPCMAIN: setMasterPass emitted Setting Masterpass...')
    // derive MasterPassKey, genPassHash and set creds globally
    MasterPass.set(masterpass)
      .then((mpkey) => {
        // set the derived MasterPassKey globally
        global.MasterPassKey = new MasterPassKey(mpkey)
        return
      })
      .then(() => {
        // save the credentials used to derive the MasterPassKey
        return global.mdb.saveGlobalObj('creds')
      })
      .then(() => {
        // Inform user that the MasterPass has successfully been set
        webContents.send('setMasterPassResult', null)
      })
      .catch((err) => {
        // Inform user of the error that occured while setting the MasterPass
        webContents.send('setMasterPassResult', err)
        error = err
      })
  })

  ipc.on('done', function (event, masterpass) {
    // Dond event emotted from render process
    logger.info('IPCMAIN: done emitted setup complete. Closing...')
    // Setup successfully finished
    // therefore set error to nothing
    error = null
    // close window (invokes 'closed') event
    win.close()
  })

  win.on('closed', function () {
    logger.verbose('IPCMAIN: win.closed event emitted for setupWindow.')
    // close window by setting it to nothing (null)
    win = null
    // if error occured then send error back to callee else send null
    callback((error) ? error : null)
  })
}

// exporting window to be used in MasterPass module
function MasterPassPromptWindow (callback) {
  let gotMP = false // init gotMP flag with false
  let error = null
  const CLOSE_TIMEOUT = 2000
  // creates a new BrowserWindow
  let win = new BrowserWindow({
    width: 300,
    height: 435,
    center: true,
    titleBarStyle: 'hidden-inset',
    resizable: false
  })
  let webContents = win.webContents

  // loads masterpassprompt.html view into the BrowserWindow
  win.loadURL(global.views.masterpassprompt)

  ipc.on('checkMasterPass', function (event, masterpass) {
    logger.verbose('IPCMAIN: checkMasterPass emitted. Checking MasterPass...')
    // Check user submitted MasterPass
    MasterPass.check(masterpass)
      .then((res) => {
        if (res.match) {
          // Password matches
          logger.info('IPCMAIN: PASSWORD MATCHES!')
          // Save MasterPassKey (while program is running)
          global.MasterPassKey = new MasterPassKey(res.key)
          // send result match result to masterpassprompt.html
          webContents.send('checkMasterPassResult', {
            err: null,
            match: res.match
          })
          gotMP = true
          // Close after 1 second
          setTimeout(function () {
            // close window (invokes 'closed') event
            win.close()
          }, CLOSE_TIMEOUT)
        } else {
          logger.warn('IPCMAIN: PASSWORD DOES NOT MATCH!')
          webContents.send('checkMasterPassResult', {
            err: null,
            match: res.match
          })
        }
      })
      .catch((err) => {
        // Inform user of error (on render side)
        webContents.send('checkMasterPassResult', err)
        // set error
        error = err
        // Close after 1 second
        setTimeout(function () {
          // close window (invokes 'closed') event
          win.close()
        }, CLOSE_TIMEOUT)
      })
  })

  win.on('closed', function () {
    logger.info('win.closed event emitted for PromptWindow')
    // send error and gotMP back to callee (masterPassPromptWindow Promise)
    callback(error, gotMP)
    // close window by setting it to nothing (null)
    win = null
  })

  return win
}
