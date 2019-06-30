'use strict'
/**
 * common.js
 * Contains all the functionality that is common between the views
 ******************************/

/* Common variables */

// Load JQuery library and make accessible via $
window.$ = window.jQuery = require('jquery')
// Cross-view dependencies
const {ipcRenderer, remote, shell} = require('electron')
const { app } = remote
const logger = require('electron-log')
const {REGEX, RESPONSES, COLORS} = require('../config')
const Handlebars = require('handlebars')

/* Shared functions */
function navigate (panel) {
  let oldSel = $('.panel-container > div.current') // get current panel
  let sel = $(`#panel-${panel}`) // get panel to navigate to
  oldSel.removeClass('current') // apply hide styling
  sel.addClass('current') // apply show styling
}

function validateMasterPass(field, errLabel) {
  const MPel = $(`input#${field}Input`)
  const masterpass = MPel.val()
  if (!masterpass) {
    // MP is empty
    // set errLabel text to response for empty and show errLabel
    errLabel.text(RESPONSES.empty).show()
    // Clear MP input field
    MPel.val('')
  } else if (REGEX.MASTERPASS.test(masterpass)) {
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
$(window).on('load', function() {
  $(".navigationLink").each(function(index) {
    let $this = $(this)
    $this.on('click', function(event) {
      let target = $this.data("target")
      let panel = $this.data("panel")
      let tab = $this.data("tab")
      let action = $this.data("action")

      if (action) {
        // Is an action to perform
        if (REGEX.APP_EVENT.test(action)) {
          console.log(`Got main app event ${action}`)
          // Emit event on app
          app.emit(action)
        } else {
          console.log(`Got render event ${action}`)
          // Emit event in render proc
          ipcRenderer.emit(action)
        }
      } else if (tab) {
        console.log(`Got tab ${tab}`)
        // is a tab to navigate to
        $(".item.active").first().removeClass("active")
        $(`a[data-tab='${tab}']`).addClass("active")
        navigate(tab)
      } else if (target) {
        console.log(`Got URL ${target}`)
        // is a URL so open it
        shell.openExternal(target)
      } else if (panel) {
        console.log(`Got panel ${panel}`)
        // target is just a panel to navigate to
        navigate(panel)
      }
      return false
    })
  })
})
