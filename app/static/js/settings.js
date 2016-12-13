'use strict'
/**
 * settings.js
 * Contains scripts for settings.html
 ******************************/

const dialog = remote.dialog
const creds = remote.getGlobal('creds')
const paths = remote.getGlobal('paths')
const buf2hex = require('../core/crypto').buf2hex
let errLabel
// let settings = remote.getGlobal("settings")

$(window).on('load', function () {
  errLabel = $('#errLabel')
  // Render the credentials
  let creds_temp = Handlebars.compile($('#creds-template').html())
  $('#creds').prepend(creds_temp({
    mpsalt: buf2hex(creds.mpsalt),
    mpkhash: creds.mpkhash,
    mpksalt: creds.mpksalt
  }))
})

ipcRenderer.on('export', function () {
  dialog.showOpenDialog({
    title: 'Choose a dir to export to',
    defaultPath: paths.documents,
    properties: ['openDirectory']
  }, function (dirPath) {
    // callback for selected file
    // returns undefined if file not selected by user
    if (dirPath && dirPath.length === 1) {
      errLabel.hide()
      console.log(`Got dirpath ${dirPath[0]}`)
      ipcRenderer.send('export', dirPath[0])
    }
  })
})

ipcRenderer.on('exportResult', function (event, err) {
  if (err) {
    errLabel.text(`ERROR: ${err.message}`.toUpperCase()).css('color', COLORS.bad).show()
  } else {
    errLabel.text(RESPONSES.exportSuccess).css('color', COLORS.good).show()
  }
})

ipcRenderer.on('import', function () {
  dialog.showOpenDialog({
    title: 'Choose the crypter credentials file',
    defaultPath: paths.documents,
    properties: ['openFile']
  }, function (filePath) {
    // callback for selected file
    // returns undefined if file not selected by user
    if (filePath && filePath.length === 1) {
      errLabel.hide()
      console.log(`Got filePath ${filePath[0]}`)
      ipcRenderer.send('import', filePath[0])
    }
  })
})

ipcRenderer.on('importResult', function (event, err) {
  window.erro = err
  if (err) {
    console.log(JSON.stringify(err))
    errLabel.text(`ERROR: ${err}`.toUpperCase()).css('color', COLORS.bad).show()
  } else {
    errLabel.text(RESPONSES.importSuccess).css('color', COLORS.good).show()
  }
})
