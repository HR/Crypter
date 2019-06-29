'use strict'
/**
 * crypter.js
 * Contains scripts for crypter.html
 ******************************/
const dialog = remote.dialog
const paths = remote.getGlobal('paths')
const path = require('path')
let errLabel, fileInput, fileInputD, cryptedContainer, fileInputText, ifileInputText, crypted_template

$(window).on('load', function () {
  // Get DOM elements
  errLabel = $('#errLabel')
  fileInput = $('#fileInput')
  fileInputD = document.getElementById('fileInput')
  cryptedContainer = $('#crypted-container')
  fileInputText = fileInput.find('#fileInputText')
  ifileInputText = fileInputText.text()
  // compile the crypted template
  crypted_template = Handlebars.compile($('#crypted-template').html())
  // attach  event
  fileInputD.ondragover = function () {
    return false
  }
  fileInputD.ondragleave = fileInputD.ondragend = function () {
    return false
  }

  turnFileInputOn()
})

/* Event listeners */
ipcRenderer.on('cryptedFile', function (event, file) {
  logger.verbose(`IPCRENDER cryptedFile emitted`)
  let fileHTML = crypted_template(file)
  cryptedContainer.html(fileHTML)
  fileInputText.text(ifileInputText)
  navigate('crypted')
  turnFileInputOn()
})
ipcRenderer.on('decryptedFile', function (event, file) {
  logger.verbose(`IPCRENDER decryptedFile emitted`)
  let fileHTML = crypted_template(file)
  cryptedContainer.html(fileHTML)
  fileInputText.text(ifileInputText)
  navigate('crypted')
  turnFileInputOn()
})
ipcRenderer.on('cryptErr', function (event, err) {
  logger.verbose(`IPCRENDER cryptErr emitted`)
  errLabel.text(`ERROR: ${err}`).show()
  fileInputText.text(ifileInputText)
  turnFileInputOn()
})

/* Helper functions */
function turnFileInputOff () {
  fileInput.off('click', handler)
  fileInput.ondrop = function () {
    return false
  }
}
function turnFileInputOn () {
  fileInput.on('click', handler)
  fileInputD.ondrop = function (e) {
    e.preventDefault()
    logger.info(`ONDROP fired!`)
    if (e.dataTransfer.files[0].path) {
      logger.info(`Got file: ${e.dataTransfer.files[0].path}`)
      handleFile(e.dataTransfer.files[0].path)
    }
    return false
  }
}
function handleFile (file) {
  let fileExt = path.extname(file)
  turnFileInputOff()
  errLabel.hide()

  if (fileExt.toLowerCase() === CRYPTO.EXT) {
    // Decrypt file
    fileInputText.text(`Decrypting ${path.basename(file)}...`)
    // send file to decryptFile controller function
    ipcRenderer.send('decryptFile', file)
  } else {
    // Encrypt file
    fileInputText.text(`Encrypting ${path.basename(file)}...`)
    // send file to crypter controller function
    ipcRenderer.send('cryptFile', file)
  }
}

function handler () {
  // Prevent multiple input dialog
  fileInput.off('click', handler)
  // Create file input dialog
  dialog.showOpenDialog({
    title: 'Choose a file to Encrypt',
    defaultPath: paths.documents, // open dialog at home directory
    properties: ['openFile', 'openDirectory']
  }, function (filePath) {
    // callback for selected file returns undefined if file not selected by user
    if (filePath && filePath.length === 1) {
      handleFile(filePath[0])
    } else {
      fileInput.on('click', handler)
    }
  })
  return false
}
