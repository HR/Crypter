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
const URL_REGEX = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
const RESPONSES = {
  invalid: 'MUST CONTAIN 1 ALPHABET, 1 NUMBER, 1 SYMBOL AND BE AT LEAST 8 CHARACTERS',
  correct: 'CORRECT MASTERPASS',
  incorrect: 'INCORRECT MASTERPASS',
  setSuccess: 'MASTERPASS SUCCESSFULLY SET',
  empty: 'PLEASE ENTER A MASTERPASS',
  resetSuccess: 'You have successfully reset your MasterPass. You\'ll be redirected to verify it shortly.'
}
const COLORS = {
  bad: '#9F3A38',
  good: '#2ECC71',
  highlight: '#333333'
}

/* Shared functions */
function openURL(url) {
  require('electron').shell.openExternal(url);
  return false;
}

function navigate (dest) {
  // Check if dest is a URL
  if (URL_REGEX.test(dest)) {
    // Open URL
    shell.openExternal(dest)
  } else {
    let oldSel = $('.panel-container > div.current') // get current panel
    let sel = $(`#panel-${dest}`) // get panel to navigate to
    $('.current button').hide()
    oldSel.removeClass('current') // apply hide styling
    sel.addClass('current') // apply show styling
  }
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

/* Onload */
$(window).load(function() {
  $(".navigationLink").each(function(index) {
    let $this = $(this)
    $(this).on('click', function(event) {
      let target = $this.data("target")
      let action = $this.data("action")
      if (action) {
        // TODO: Action (i.e. check for updates/open updater)
        console.log(`${this} has data-action attr of ${action}`)
        ipcRenderer.send(action)
      } else {
        $(".active").first().removeClass("active")
        $(`a[data-target='${target}']`).addClass("active")
        navigate(target)
      }
      return false
    })
  })
})
