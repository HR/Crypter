'use strict'
const {app, ipcMain, dialog, Menu, BrowserWindow, shell} = require('electron')
const crypto = require('./core/crypto')
const Db = require('./core/Db')
const MasterPass = require('./core/MasterPass')
const MasterPassKey = require('./core/MasterPassKey')
const menuTemplate = require('./src/menu')
const _ = require('lodash')
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
  crypter: `file://${__dirname}/static/crypter.html`,
  settings: `file://${__dirname}/static/settings.html`
}
const logger = require('./script/logger')

// change exec path
logger.info(`AppPath: ${app.getAppPath()}`)
logger.info(`UseData Path: ${app.getPath('userData')}`)
process.chdir(app.getAppPath())
logger.info(`Changed cwd to: ${process.cwd()}`)
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

const closeDb = function () {
  if (_.isEmpty(global.mdb) ? false : global.mdb.open) {
    // close mdb before quitting if opened
    // return promise
    return global.mdb.close()
  }
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
            // Catch any fatal errors and exit
            logger.error(`PROMISE ERR: ${error.stack}`)
            // dialog.showErrorBox('Oops, we encountered a problem...', error.message)
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
            dialog.showErrorBox('Oops, we encountered a problem...', error.message)
            app.quit()
          })
      }
    })
    .catch(function (error) {
      logger.error(`PROMISE ERR: ${error.stack}`)
      // Display error to user
      dialog.showErrorBox('Oops, we encountered a problem...', error.message)
      app.quit()
    })
})

app.on('window-all-closed', () => {
  logger.verbose('APP: window-all-closed event emitted')
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
})

app.on('quit', () => {
  logger.info('APP: quit event emitted')
  closeDb().catch((err) => {
    console.error(err)
    throw err
  })
})

app.on('will-quit', (event) => {
  // will exit program once exit procedures have been run (exit flag is true)
  logger.info(`APP.ON('will-quit'): will-quit event emitted`)
  closeDb().catch((err) => {
    console.error(err)
    throw err
  })
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
    show: true,
    titleBarStyle: 'hidden-inset',
    resizable: false,
    movable: true
  })

  let webContents = win.webContents

  // loads crypt.html view into the BrowserWindow
  win.loadURL(global.views.crypter)

  // When user selects a file to encrypt in Crypter window
  ipcMain.on('cryptFile', function (event, filePath) {
    logger.verbose('IPCMAIN: cryptFile emitted. Starting encryption...')
    crypto.crypt(filePath, global.MasterPassKey.get())
      .then((file) => {
        webContents.send('cryptedFile', file)
      })
      .catch((err) => {
        logger.info(`cryptFile error`)
        logger.error(err)
        webContents.send('cryptErr', err)
      })
  })

  // When user selects a file to decrypt in Crypter window
  ipcMain.on('decryptFile', function (event, filePath) {
    logger.verbose('IPCMAIN: decryptFile emitted. Starting decryption...')
    // let destPath = filePath.replace('.crypto', '.decrypto')
    crypto.decrypt(filePath, global.MasterPassKey.get())
      .then((file) => {
        logger.info('decrypted')
        webContents.send('decryptedFile', file)
      })
      .catch((err) => {
        logger.info(`decryptFile error`)
        logger.error(err)
        webContents.send('cryptErr', err.message)
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
    resizable: false,
    movable: true
  })

  let webContents = win.webContents
  let error
  // loads setup.html view into the SetupWindow
  win.loadURL(global.views.setup)

  ipcMain.on('setMasterPass', function (event, masterpass) {
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

  ipcMain.on('done', function (event, masterpass) {
    // Dond event emotted from render process
    logger.info('IPCMAIN: done emitted setup complete. Closing...')
    // Setup successfully finished
    // therefore set error to nothing
    error = null
    // Relaunch Crypter
    app.relaunch()
    // Exit successfully
    app.exit(0)
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
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
  // creates a new BrowserWindow
  let win = new BrowserWindow({
    width: 300,
    height: 450,
    center: true,
    show: true,
    titleBarStyle: 'hidden-inset',
    resizable: false,
    movable: true
  })
  let webContents = win.webContents

  // loads masterpassprompt.html view into the BrowserWindow
  win.loadURL(global.views.masterpassprompt)

  ipcMain.on('checkMasterPass', function (event, masterpass) {
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

  ipcMain.on('setMasterPass', function (event, masterpass) {
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
        logger.verbose('IPCMAIN: Masterpass has been reset successfully')
        webContents.send('setMasterPassResult', null)
      })
      .catch((err) => {
        // Inform user of the error that occured while setting the MasterPass
        webContents.send('setMasterPassResult', err)
        error = err
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

function SettingsWindow (callback) {
  // creates a new BrowserWindow
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    center: true,
    show: true,
    titleBarStyle: 'hidden-inset',
    resizable: false,
    movable: true
  })

  let webContents = win.webContents

  // loads settings.html view into the BrowserWindow
  win.loadURL(global.views.settings)

  win.on('closed', function () {
    logger.info('win.closed event emitted for SettingsWindow')
    win = null
    callback()
  })

  return win
}
