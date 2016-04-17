'use strict'
/**
 * util.js
 * Contains essential common utilities required
 ******************************/
const fs = require('fs')
const path = require('path')

exports.checkDirectorySync = function (dir) {
  return exports.checkFileSync(dir)
}

exports.checkFileSync = function (path) {
  try {
    fs.accessSync(path, fs.F_OK)
  } catch (err) {
    if (err.code === 'ENOENT') return false
  }
  return true
}
