'use strict'
/**
 * masterpassprompt.js
 * Contains scripts for masterpassprompt.html
 ******************************/

const DONE_TIMEOUT = 5000
let errLabelCheckMP, errLabelSetMP, resetMasterPassInput

$(window).on('load', function () {
  // Get error label element
  errLabelCheckMP = $('#checkMasterPassLabel')
  errLabelSetMP = $('#setMasterPassLabel')
  resetMasterPassInput = $('#resetMasterPassInput')
  // When DOM has loaded...
  navigate('default')
  // hide error label and make red
  errLabelCheckMP.hide().css('color', COLORS.bad)

  // attach event listener to checkMasterPass button
  $('#checkMasterPass').click(function () {
    validateMasterPass('checkMasterPass', errLabelCheckMP)
  })
  // attach click event listener to setMasterPass button
  $('#setMasterPass').click(function () {
    // Event handler function
    validateMasterPass('setMasterPass', errLabelSetMP)
  })
})

/* Event listeners */
ipcRenderer.on('setMasterPassResult', function (event, err) {
  if (err) {
    // If error occured
    // Display the error
    errLabelSetMP.text(`ERROR: ${err.message}`.toUpperCase()).css('color', COLORS.bad).show()
  } else {
    // Display the MasterPass set success
    errLabelSetMP.text(RESPONSES.setSuccess).css('color', COLORS.good).show()
    // Change note text to give further instruction and higlight it
    $('p.note').html(RESPONSES.resetSuccess).css('color', COLORS.highlight)
    // Close navigate back to chechMP after 5 seconds
    setTimeout(function () {
      navigate('default')
    }, DONE_TIMEOUT)
  }
})

ipcRenderer.on('checkMasterPassResult', function (event, result) {
  if (result.err) {
    errLabelCheckMP.text(`ERROR: ${err.message}`)
      .show()
  } else if (result.match) {
    resetMasterPassInput.hide()
    errLabelCheckMP.text(RESPONSES.correct)
      .css('color', COLORS.good)
      .show()
  } else {
    errLabelCheckMP.text(RESPONSES.incorrect)
      .show()
  }
})
