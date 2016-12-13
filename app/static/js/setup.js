'use strict'
/**
 * setup.js
 * Contains scripts for setup.html
 ******************************/

// Delay (in ms) after which it navigates to the done panel
const NAV2DONE_TIMEOUT = 2000
// Delay (in ms) after which the setup window is closed
const DONE_TIMEOUT = NAV2DONE_TIMEOUT + 5000
// Animation config
const SPEED = 3000
const OFFSET = SPEED * 1.1
let errLabel

$(window).on('load', function () {
  // Load jQuery marquee plugin
  window.$.marquee = window.jQuery.marquee = require('jquery.marquee')
  // Get error label
  errLabel = $('#setMasterPassLabel')
  // When DOM has loaded... hide error label and make red
  errLabel.hide().css('color', COLORS.bad)

  // attach click event listener to setMasterPass button
  $('#setMasterPass').click(function () {
    // Event handler function
    validateMasterPass('setMasterPass', errLabel)
  })

  $('#done').click(function () {
    // Close setup window and restart app
    ipcRenderer.send('done')
  })

  // navigate to welcome screen by default
  navigate('welcome')

  /* Encryption animation */
  $('.marquee-1').marquee({direction: 'right', gap: 0, duplicated: true, duration: SPEED}).addClass('visible')
  $('.marquee-2').marquee({direction: 'right', gap: 0, duplicated: true, duration: SPEED, delayBeforeStart: OFFSET})

  setTimeout(function () {
    $('.marquee-2').addClass('visible')
  }, OFFSET)
})

/* Event listeners */
ipcRenderer.on('setMasterPassResult', function (event, err) {
  if (err) {
    // If error occured Display the error
    errLabel.text(`ERROR: ${err.message}`.toUpperCase())
    errLabel.show()
  } else {
    // Display the MasterPass set success
    errLabel.text(RESPONSES.setSuccess).css('color', COLORS.good).show()
    setTimeout(function () {
      // Navigate to the done panel after 2 seconds
      navigate('done')
    }, NAV2DONE_TIMEOUT)

  // Invoke (setup) done event in main after 5 seconds So that user has time to comprehend the above change setTimeout(function() {   // Close setup window after 5 seconds   ipcRenderer.send('done') }, DONE_TIMEOUT)
  }
})
