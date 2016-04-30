'use strict'
/**
 * common.js
 * Contains all the functionality that is common between the views
 ******************************/

/* Common variables */

// Load JQuery library and make accessible via $
window.$ = window.jQuery = require('jquery')
// load interprocess communication module
var ipcRenderer = require('electron').ipcRenderer
// MasterPass regular expression
const MP_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,}$/g
const RESPONSES = {
  invalid: 'MUST CONTAIN 1 ALPHABET, 1 NUMBER, 1 SYMBOL AND BE AT LEAST 8 CHARACTERS',
  correct: 'CORRECT MASTERPASS',
  incorrect: 'INCORRECT MASTERPASS',
  setSuccess: 'MASTERPASS SUCCESSFULLY SET',
  empty: 'PLEASE ENTER A MASTERPASS',
  done: 'You have successfully completed the setup! <br/> Please relaunch the program to start encrypting after this window closes automatically'
}
const COLORS = {
  bad: '#9F3A38',
  good: '#2ECC71',
  highlight: '#333333'
}

/* Shared functions */
function navigate (panelName) {
  var oldSel = $('.panel-container > div.current') // get current panel
  var sel = $(`#panel-${panelName}`) // get panel to navigate to
  $('.current button').hide()
  oldSel.removeClass('current') // apply hide styling
  sel.addClass('current') // apply show styling
}

function validateMasterPass (field, errLabel) {
  var MPel = $(`input#${field + 'Input'}`)
  const masterpass = MPel.val()
  if (!masterpass) {
    // MP is empty
    // set errLabel text to response for empty and show errLabel
    errLabel.text(RESPONSES.empty).show()
    // Clear MP input field
    MPel.val('')
  } else if (MP_REGEX.test(masterpass)) {
    // MP is valid
    // Hide errLabel
    errLabel.hide()
    // Send valid MasterPass to controller function to be checked
    ipcRenderer.send(field, masterpass)
  } else {
    // set errLabel text to response for invalid and show errLabel
    errLabel.text(RESPONSES.invalid).show()
    // Clear MP input field
    MPel.val('')
  }
}
