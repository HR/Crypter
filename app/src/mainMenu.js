const {app, shell} = require('electron')
const menu = require('./menu')

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
