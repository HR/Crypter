const {app, ipcMain, BrowserWindow} = require('electron')
const logger = require('winston')
const fs = require('fs-extra')
const _ = require('lodash')
const {CRYPTER_CREDS_FILE, CRYPTER_CREDS_PROPS} = require('../core/config')
const RESTART_TIMEOUT = 4000


exports.window = function (global, callback) {
  // creates a new BrowserWindow
  let win = new BrowserWindow({
    width: 600,
    height: 450,
    center: true,
    show: true,
    titleBarStyle: 'hidden-inset',
    resizable: false,
    movable: true
  })

  let webContents = win.webContents
  // loads settings.html view into the BrowserWindow
  win.loadURL(global.views.settings)

  ipcMain.on('export', (event, dir) => {
    logger.verbose(`SETTINGS: export event emitted, got ${dir}`)
    const file = `${dir}/${CRYPTER_CREDS_FILE}`
    fs.outputJson(file, global.creds, function (err) {
      if (err) {
        logger.error(err)
        webContents.send('exportResult', err)
      } else {
        // Successfully exported
        webContents.send('exportResult', null)
      }
    })
  })

  ipcMain.on('import', (event, file) => {
    logger.verbose(`SETTINGS: import event emitted, got ${file}`)
    fs.readJson(file, global.creds, function (err, credsObj) {
      if (err) {
        logger.error(err)
        webContents.send('importResult', err)
      } else {
        let isCredsObjProp = function (prop, index, array) {
          return credsObj.hasOwnProperty(prop)
        }
        let credsFileValid = CRYPTER_CREDS_PROPS.every(isCredsObjProp)
        logger.verbose(`SETTINGS: Got for credsFileValid ${credsFileValid}`)

        if (credsFileValid) {
          // Is valid (i.e. has required properties)
          // Save in-memory - global creds obj
          global.creds = credsObj
          // Save to fs - via global mdb
          global.mdb.saveGlobalObj('creds')
          // Successfully imported
          webContents.send('importResult', null)
          // Restart after timeout
          setTimeout(function () {
            app.emit('app:relaunch')
          }, RESTART_TIMEOUT);
        } else {
          webContents.send('importResult', new Error('Not a valid Crypter credentials file!'))
        }

      }
    })
  })

  win.on('closed', function () {
    logger.info('win.closed event emitted for SettingsWindow')
    win = null
    callback()
  })

  return win
}
