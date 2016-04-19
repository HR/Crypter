'use strict'
const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipc = electron.ipcMain
const shell = electron.shell
const dialog = electron.dialog
const util = require('./src/util')
const crypto = require('./src/crypto')
const Db = require('./src/Db')
const MasterPass = require('./src/MasterPass')
const MasterPassKey = require('./src/_MasterPassKey')
const init = require('./init')
const path = require('path')
const _ = require('lodash')
const logger = require('./script/logger')
// change exec path
logger.info(`AppPath: ${app.getAppPath()}`)
logger.info(`__dirname: ${__dirname}`)
process.chdir(app.getAppPath())
logger.info(`Changed cwd to: ${process.cwd()}`)

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')()

// MasterPassKey is protected (private var) and only exist in Main memory
// MasterPassKey is a derived key of the actual user MasterPass

global.creds = {}
global.paths = {
  mdb: `${app.getPath('userData')}/mdb`,
  userData: app.getPath('userData')
}
global.views = {
  masterpassprompt: `file://${__dirname}/static/masterpassprompt.html`,
  setup: `file://${__dirname}/static/setup.html`,
  crypter: `file://${__dirname}/static/crypter.html`
}

// prevent the following from being garbage collected

/**
 * Main (run once app is in ready state)
 **/

app.on('ready', function () {
  // Check synchronously whether paths exist
  init.run()
   .then((mainRun) => {
     // If the MDB or vault does not exist, run setup
     // otherwise run main
     if (mainRun) {
       // Run main
       logger.info('Main run. Creating CryptWindow...')

       init.main() // Initialise (open mdb and get creds)
         .then(() => {
           return MasterPass.Prompt() // Obtain MP, derive MPK and set globally
         })
         .then(() => {
           // Start menubar
           return cryptWindow()
         })
         .then(() => {
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
           // setup successfully completed
           app.quit()
         })
         .catch(function (error) {
           logger.error(`PROMISE ERR: ${error.stack}`)
           // dialog.showErrorBox('Oops, we encountered a problem...', error.message)
           app.quit()
         })
     }
   })
   .catch(function (error) {
     logger.error(`PROMISE ERR: ${error.stack}`)
     // dialog.showErrorBox('Oops, we encountered a problem...', error.message)
     app.quit()
   })
})

/**
 * Event handlers
 **/
app.on('window-all-closed', () => {
  logger.verbose('APP: window-all-closed event emitted')
})
app.on('quit', () => {
  logger.info('APP: quit event emitted')
})

app.on('will-quit', (event) => {
  // will exit program once exit procedures have been run (exit flag is true)
  // even.preventDefault()
  logger.info(`APP.ON('will-quit'): will-quit event emitted`)
  if (!_.isEmpty(global.mdb)) {
    // close mdb
    global.mdb.close()
  }
})

/**
 * Promises
 **/

 let cryptWindow = function () {
   return new Promise(function(resolve, reject) {
     CryptWindow(function () {
       resolve()
     })
   })
 }

 let setupWindow = function () {
   return new Promise(function (resolve, reject) {
     SetupWindow(function (err) {
       if (err) {
         logger.error(err)
         reject(err)
       } else {
         logger.info('MAIN Setup successfully completed. quitting...')
         resolve()
       }
     })
   })
 }


/**
 * Windows
 **/

function CryptWindow (callback) {
  // creates a new BrowserWindow
  let win = new BrowserWindow({
    width: 350, // 300
    height: 450,
    center: true,
    titleBarStyle: 'hidden-inset'
    // resizable: false
  })

  let webContents = win.webContents

  // loads crypt.html view into the BrowserWindow
  win.loadURL(global.views.crypter)
  // win.openDevTools()

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
  win.on('closed', function () {
    logger.info('win.closed event emitted for PromptWindow')
    win = null
    callback()
  })

  return win
}

function SetupWindow (callback) {
  // creates a new BrowserWindow
  let win = new BrowserWindow({
    width: 600,
    height: 400,
    center: true,
    show: true,
    titleBarStyle: 'hidden-inset'
  // width: 580,
  // height: 420
  // resizable: false,
  })

  let setupComplete = false
  let webContents = win.webContents
  // loads setup.html view into the SetupWindow
  win.loadURL(global.views.setup)
  // win.openDevTools()

  webContents.on('will-navigate', function (event, url) {
    logger.verbose(`IPCMAIN: will-navigate emitted URL: ${url}`)
  })

  ipc.on('setMasterPass', function (event, masterpass) {
    logger.verbose('IPCMAIN: setMasterPass emitted Setting Masterpass...')
    MasterPass.set(masterpass)
      .then((mpkey) => {
        global.MasterPassKey = new MasterPassKey(mpkey)
        return
      })
      .then(() => {
        return global.mdb.saveGlobalObj('creds')
      })
      .then(() => {
        webContents.send('setMasterPassResult', null)
      })
      .catch((err) => {
        webContents.send('setMasterPassResult', err)
        throw err
      })
  })

  ipc.on('done', function (event, masterpass) {
    logger.info('IPCMAIN: done emitted setup complete. Closing this window and opening menubar...')
    setupComplete = true
    win.close()
  })

  win.on('closed', function () {
    logger.verbose('IPCMAIN: win.closed event emitted for setupWindow.')
    win = null
    if (setupComplete) {
      // User successfully completed the setup, report
      callback(null)
    } else {
      // User quit the setup, report error
      callback(new Error('SetupWindow did not finish successfully'))
    }
  })
}


// exporting window to be used in MasterPass module
exports.MasterPassPromptWindow = function (callback) {
  let gotMP = false
  let error = null
  const CLOSE_TIMEOUT = 1000
  // creates a new BrowserWindow
  let win = new BrowserWindow({
    width: 300, // 300
    height: 435,
    center: true,
    titleBarStyle: 'hidden-inset'
  // resizable: false,
  })
  let webContents = win.webContents

  // loads masterpassprompt.html view into the BrowserWindow
  win.loadURL(global.views.masterpassprompt)
  // win.openDevTools()
  ipc.on('checkMasterPass', function (event, masterpass) {
    logger.verbose('IPCMAIN: checkMasterPass emitted. Checking MasterPass...')
    MasterPass.check(masterpass)
      .then((res) => {
        if (res.match) {
          // password matches
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
        // send error
        webContents.send('checkMasterPassResult', err)
        error = err
        // Close after 1 second
        setTimeout(function () {
          win.close()
        }, CLOSE_TIMEOUT)
      })
  })

  win.on('closed', function () {
    logger.info('win.closed event emitted for PromptWindow')
    callback(error, gotMP)
    win = null
  })

  return win
}
