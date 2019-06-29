const https = require('https')
const { app, dialog, shell } = require('electron')
const { REPO } = require('../config')
const USER_AGENT = 'Crypter/x Wubba Lubba Dub Dub'
const VERSION_REGEX = /[\.v]+/g
const VERSION = parseV(app.getVersion())

function parseV(str) {
  return parseInt(str.replace(VERSION_REGEX, ''))
}

module.exports = {
  isRenderer: function () {
    // running in a web browser
    if (typeof process === 'undefined') return true

    // node-integration is disabled
    if (!process) return true

    // We're in node.js somehow
    if (!process.type) return false

    return process.type === 'renderer'
  },
  checkUpdate: function () {
    return new Promise((resolve, reject) => {
      https.get(REPO.RELEASES_API_URL, {
          headers: { 'User-Agent': USER_AGENT }
        }, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            try {
              release = JSON.parse(data.toString('utf8'))
              const LATEST_VERSION = parseV(release.tag_name)
              if (VERSION < LATEST_VERSION) {
                dialog.showMessageBox({
                  type: 'info',
                  message: `Update is available.`,
                  detail: `A new version Crypter ${release.tag_name} is available.\nDo you want to get it?`,
                  buttons: ['Get update', 'Later'],
                  defaultId: 0,
                  cancelId: 1,
                  icon: null
                }, (response) => {
                  if (response === 0) {
                    // Update button pressed
                    shell.openExternal(release.html_url)
                  }
                })
                resolve(true)
              } else {
                resolve(false)
              }
            } catch (err) {
              reject(err)
            }
          })
        })
        .on('error', (err) => reject(err))
    })
  }

}