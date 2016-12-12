const {app, ipcMain, BrowserWindow} = require('electron')
const {VIEWS} = require('../config')
const MasterPass = require('../core/MasterPass')
const MasterPassKey = require('../core/MasterPassKey')
const logger = require('winston')


exports.window = function (global, callback) {
  let gotMP = false // init gotMP flag with false
  let error = null
  const CLOSE_TIMEOUT = 2000
  // creates a new BrowserWindow
  let win = new BrowserWindow({
    width: 300,
    height: 420,
    center: true,
    show: true,
    titleBarStyle: 'hidden-inset',
    resizable: false,
    maximizable: false,
    movable: true
  })
  let webContents = win.webContents

  // loads masterpassprompt.html view into the BrowserWindow
  win.loadURL(VIEWS.MASTERPASSPROMPT)

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