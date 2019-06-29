const {app, Menu, shell} = require('electron')
const {REPO} = require('../config')

const menu = [
  {
    label: 'Edit',
    submenu: [
      {
        role: 'undo'
      },
      {
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        role: 'cut'
      },
      {
        role: 'copy'
      },
      {
        role: 'paste'
      },
      {
        role: 'pasteandmatchstyle'
      },
      {
        role: 'delete'
      },
      {
        role: 'selectall'
      }
    ]
  },
  {
    label: 'Help',
    role: 'help',
    submenu: [
      { label: 'Documentation', click() { shell.openExternal(REPO.DOCS)} },
      { type: 'separator' },
      { label: 'Report Issue', click() { shell.openExternal(REPO.REPORT_ISSUE)} },
      { label: 'Star Crypter', click() { shell.openExternal(REPO.URL)} },
      { label: 'Contribute', click() { shell.openExternal(REPO.FORK)} },
    ]
  }
]

if (process.platform === 'darwin') {
  menu.unshift({
    label: 'Crypter',
    submenu: [
      { label: 'About Crypter', role: 'about' },
      { label: `Version ${app.getVersion()}`, enabled: false },
      { label: 'Check for Update', click() { app.emit('app:check-update') } },
      { type: 'separator' },
      { label: 'Preferences…', click() { app.emit('app:open-settings') } },
      { type: 'separator' },
      { label: 'Quit', click() { app.emit('app:quit') } }
    ]
  })
}

module.exports = menu
