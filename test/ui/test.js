'use strict'
const Application = require('spectron').Application
const assert = require('assert')
const chai = require('chai')
const fs = require('fs-extra')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
const path = require('path')
const logger = require('../../script/logger')

chai.should()
chai.use(chaiAsPromised)

console.log(`cwd: ${process.cwd()}`)
console.log(`__dirname: ${__dirname}`)

let wait = function (s) {
  return new Promise((resolve, reject) => {
    setTimeout(function () {
      resolve()
    }, s)
  })
}

let saveScreenshot = function (client, filename) {
  return new Promise(function(resolve, reject) {
    // receive screenshot as Buffer
    var screenshot = client.saveScreenshot()
    fs.writeFileSync(filename, screenshot, 'base64')
    resolve()
    // fs.writeFile(filename, client.saveScreenshot() , 'base64', function (err) {
    //   if (err) reject(err)
    //   resolve()
    // })
  })
}

const masterpass = 'random#101'

var responses = {
  invalid: 'MUST CONTAIN 1 ALPHABET, 1 NUMBER, 1 SYMBOL AND BE AT LEAST 8 CHARACTERS',
  incorrect: 'INCORRECT MASTERPASS',
  correct: 'CORRECT MASTERPASS',
  setSuccess: 'MASTERPASS SUCCESSFULLY SET',
  empty: 'PLEASE ENTER A MASTERPASS',
}

describe("Crypter Render Modules's tests", function () {
  this.timeout(10000)

  // before(function () {
  //   global.paths = {
  //     mdb: `${this.app.getPath('userData')}/mdb`
  //   }
  //
  //   console.log(require('util').inspect(global.paths, { depth: null }))
  //   return this.app.start()
  // })

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
    // before(() => {
    //   // remove /Crypter app dir in userdata before test
    //   fs.removeSync(``)
    // })

    it('should give response for masterpass input', function () {
      const nomp = ''
      const invalidmp = 'random'
      let checkResponse = function (client, input, response) {
        client.setValue('#setMasterPassInput', input)
          .click('#setMasterPass')
          .then(() => {
            return wait(300) // wait 2 seconds
          })
          .then(() => {
            return saveScreenshot(client, `./screens/${response}.png`)
          })
          .getText('#setMasterPassLabel')
          .then((text) => {
            expect(text).to.equal(response)
          })
      }
      return this.app.client
        .then(() => {
          return wait(2000) // wait 2 seconds
        })
        .click('#getstarted')
        .then(() => {
          return wait(1000) // wait 2 seconds
        })
        .then(() => {
          return checkResponse(this.app.client, nomp, responses.empty)
        })
        // .then(() => {
        //   return saveScreenshot(this.app.client, '../../screens/masterpass_empty.png')
        // })
        .then(() => {
          return checkResponse(this.app.client, invalidmp, responses.invalid)
        })
        .then(() => {
          return checkResponse(this.app.client, masterpass, responses.setSuccess)
        })
        .then(() => {
          return wait(500) // wait 2 seconds
        })
        .catch((err) => {
          throw err
        })
    })
  })

  describe('Main', function () {
    before(() => {
    })

    let checkResponse = function (client, input, response) {
      client.setValue('#checkMasterPassInput', input)
        .click('#checkMasterPass')
        .then(() => {
          return wait(300) // wait 2 seconds
        })
        .getText('#checkMasterPassLabel')
        .then((text) => {
          expect(text).to.equal(response)
        })
    }

    it('should give response for incorrect masterpass', function () {
      const mp = 'yolo#10111'
      return this.app.client
        .then(() => {
          return checkResponse(this.app.client, mp, responses.incorrect)
        })
    })

    it('should give response for invalid masterpass', function () {
      const mp = 'yolo'
      return this.app.client
        .then(() => {
          return checkResponse(this.app.client, mp, responses.invalid)
        })
    })

    it('should give response for empty masterpass', function () {
      const mp = ''
      return this.app.client
        .then(() => {
          return checkResponse(this.app.client, mp, responses.empty)
        })
    })

    it('should give response for correct masterpass', function () {
      return this.app.client
        .then(() => {
          return checkResponse(this.app.client, masterpass, responses.correct)
        })
        .getWindowCount()
        .then((count) => {
          console.log(`window count: ${count}`)
          return
        })
    })

    // it('should open file dialog on clicking window', function () {
    //   return this.app.client
    //     .then(() => {
    //       return checkResponse(this.app.client, masterpass, responses.correct)
    //     })
    //     .then(() => {
    //       return wait('5000')
    //     })
    //     .click("#holder")
    // })
  })
})
