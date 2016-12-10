const {app, ipcMain, BrowserWindow} = require('electron')
const logger = require('winston')

exports.window = function (global, callback) {
  // creates a new BrowserWindow
  let win = new BrowserWindow({
    width: 600,
    height: 400,
    center: true,
    show: true,
    titleBarStyle: 'hidden-inset'
    // resizable: false,
    // movable: true
  })

  let webContents = win.webContents

  // loads settings.html view into the BrowserWindow
  win.loadURL(global.views.settings)
  win.openDevTools()
  win.on('closed', function () {
    logger.info('win.closed event emitted for SettingsWindow')
    win = null
    callback()
  })

  return win
}
