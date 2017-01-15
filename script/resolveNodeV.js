const {app} = require('electron')
const fs = require('fs-extra')
const FILE_PATH = '.node-version'
console.log("Electron node version is: "+process.versions.node)
fs.writeFile(FILE_PATH, process.versions.node, function (err) {
  if (err) return console.log('Error writing file: ' + err)
  app.quit()
})
