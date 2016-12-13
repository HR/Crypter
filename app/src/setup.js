const {app, ipcMain, BrowserWindow} = require('electron')
const {VIEWS} = require('../config')
const MasterPass = require('../core/MasterPass')
const MasterPassKey = require('../core/MasterPassKey')
const logger = require('winston')

exports.window = function (global, callback) {
  // setup view controller

  // creates the setup window
  let win = new BrowserWindow({
    width: 600,
    height: 400,
    center: true,
    show: true,
    titleBarStyle: 'hidden-inset',
    resizable: false,
    maximizable: false,
    movable: true
  })

  let webContents = win.webContents
  let error
  // loads setup.html view into the SetupWindow
  win.loadURL(VIEWS.SETUP)

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
        logger.error(err)
        webContents.send('setMasterPassResult', err.message)
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
    app.emit('app:relaunch')
  })

  win.on('closed', function () {
    logger.verbose('IPCMAIN: win.closed event emitted for setupWindow.')
    // close window by setting it to nothing (null)
    win = null
    // if error occured then send error back to callee else send null
    callback((error) ? error : null)
  })
}