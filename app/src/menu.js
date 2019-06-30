const {app, shell} = require('electron')
const {REPO} = require('../config')

module.exports = [
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
