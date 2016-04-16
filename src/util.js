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

exports.streamToString = function (stream, callback) {
  const chunks = []
  stream.on('data', (chunk) => {
    chunks.push(chunk)
  })
  stream.on('error', function (err) {
    callback(err)
  })
  stream.on('end', () => {
    callback(null, chunks.join(''))
  })
}
