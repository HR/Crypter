const { extname } = require('path')
const { CRYPTO } = require('../config')

module.exports = {
  isRenderer: () => {
    // running in a web browser
    if (typeof process === 'undefined') return true

    // node-integration is disabled
    if (!process) return true

    // We're in node.js somehow
    if (!process.type) return false

    return process.type === 'renderer'
  },
  isCryptoFile: (file) => extname(file).toLowerCase() === CRYPTO.EXT
}