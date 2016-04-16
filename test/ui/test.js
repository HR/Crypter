'use strict'
const Application = require('spectron').Application
const assert = require('assert')
const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
const path = require('path')
const logger = require('../../script/logger')

chai.should()
chai.use(chaiAsPromised)

describe("Crypter Render Modules's tests", function () {
  this.timeout(10000)

  before(function () {
    // set vars
  })

  beforeEach(function () {
    this.app = new Application({
      // path: '../dest/Crypter-darwin-x64/Crypter.app/Contents/MacOS/Electron',
      path: path.join(__dirname, '../../dest/CrypterTest-darwin-x64/CrypterTest.app/Contents/MacOS/CrypterTest')
    })
    return this.app.start()
  })

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  })

  it('should show setup window', function () {
    return this.app.client.getWindowCount().then(function (count) {
      assert.equal(count, 1)
    })
  })

  describe('Setup', function () {
    before(() => {
    })

    it('should give response for incorrect masterpass', function () {
      return this.app.client
        .getHTML('body', function (err, html) {
          logger.info(html)
          logger.info(err)
        })
    })

  // it('should give response for empty masterpass', function () {
  //   const masterpass = ''
  //   return this.app.client
  //     .setValue('#checkMasterPassInput', masterpass)
  //     .click('#checkMasterPass')
  //     .then(() => {
  //       return new Promise(function (resolve, reject) {
  //         setTimeout(function () {
  //           resolve()
  //         }, 200)
  //       })
  //     })
  //     .getText('#checkMasterPassLabel')
  //     .should.eventually.equal(responses.empty)
  // })
  })

// describe('Main', function () {
//   var responses
//   before(() => {
//     responses = {
//       invalid: 'INVALID MASTERPASS',
//       incorrect: 'INCORRECT MASTERPASS',
//       correct: 'CORRECT MASTERPASS',
//       setSuccess: 'MASTERPASS SUCCESSFULLY SET',
//       empty: 'PLEASE ENTER A MASTERPASS',
//     }
//   })
//
//
//   it('should give response for incorrect masterpass', function () {
//     const masterpass = 'yolo#10111'
//     return this.app.client
//       .setValue('#checkMasterPassInput', masterpass)
//       .click('#checkMasterPass')
//       .then(() => {
//         return new Promise(function (resolve, reject) {
//           setTimeout(function () {
//             resolve()
//           }, 200)
//         })
//       })
//       .getText('#checkMasterPassLabel')
//       .should.eventually.equal(responses.incorrect)
//   })
//
//   it('should give response for invalid masterpass', function () {
//     const masterpass = 'yolo#10'
//     return this.app.client
//       .setValue('#checkMasterPassInput', masterpass)
//       .click('#checkMasterPass')
//       .then(() => {
//         return new Promise(function (resolve, reject) {
//           setTimeout(function () {
//             resolve()
//           }, 200)
//         })
//       })
//       .getText('#checkMasterPassLabel')
//       .should.eventually.equal(responses.invalid)
//   })
//
//   it('should give response for empty masterpass', function () {
//     const masterpass = ''
//     return this.app.client
//       .setValue('#checkMasterPassInput', masterpass)
//       .click('#checkMasterPass')
//       .then(() => {
//         return new Promise(function (resolve, reject) {
//           setTimeout(function () {
//             resolve()
//           }, 200)
//         })
//       })
//       .getText('#checkMasterPassLabel')
//       .should.eventually.equal(responses.empty)
//   })
//
//   it('should give response for correct masterpass', function () {
//     const masterpass = 'yolo#101'
//     return this.app.client
//       .setValue('#checkMasterPassInput', masterpass)
//       .click('#checkMasterPass')
//       .then(() => {
//         return new Promise(function (resolve, reject) {
//           setTimeout(function () {
//             resolve()
//           }, 200)
//         })
//       })
//       .getText('#checkMasterPassLabel')
//       .should.eventually.equal(responses.correct)
//   })
// })
})
