'use strict'
/**
 * masterpassprompt.js
 * Contains scripts for masterpassprompt.html
 ******************************/

const DONE_TIMEOUT = 2000
let errLabelCheckMP, errLabelSetMP, resetMasterPassInput
const reset = getUrlParameter('reset')

$(window).on('load', function () {
  // Get error label element
  errLabelCheckMP = $('#checkMasterPassLabel')
  errLabelSetMP = $('#setMasterPassLabel')
  resetMasterPassInput = $('#resetMasterPassInput')

  if (reset) {
    navigate('reset')
    $('footer').remove()
  } else {
    navigate('default')
  }
  // hide error label and make red
  errLabelCheckMP.hide().css('color', COLORS.bad)

  $('#checkMasterPass').click(function () {
    validateMasterPass('checkMasterPass', errLabelCheckMP)
  })

  $('#setMasterPass').click(function () {
    validateMasterPass('setMasterPass', errLabelSetMP)
    // Reset validation when reset
    errLabelCheckMP.hide()
  })
})

/* Event listeners */
ipcRenderer.on('setMasterPassResult', function (event, err) {
  if (err) {
    // If error occured
    // Display the error
    errLabelSetMP
      .text(`ERROR: ${err.message}`.toUpperCase())
      .css('color', COLORS.bad)
      .show()
  } else {
    // Display the MasterPass set success
    errLabelSetMP
      .text(RESPONSES.setSuccess)
      .css('color', COLORS.good)
      .show()
    // Change note text to give further instruction and higlight it
    $('p.note')
      .html(RESPONSES.resetSuccess)
      .css('color', COLORS.highlight)

    // Close navigate back to chechMP after 5 seconds
    setTimeout(function () {
      if (reset) {
        return app.emit('app:relaunch')
      }
      navigate('default')
      errLabelSetMP.hide()
    }, DONE_TIMEOUT)
  }
})

ipcRenderer.on('checkMasterPassResult', function (event, result) {
  if (result.err) {
    errLabelCheckMP.text(`ERROR: ${err.message}`).show()
  } else if (result.match) {
    resetMasterPassInput.hide()
    errLabelCheckMP
      .text(RESPONSES.correct)
      .css('color', COLORS.good)
      .show()
  } else {
    errLabelCheckMP.text(RESPONSES.incorrect).show()
  }
})
