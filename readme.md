<p align="center">
  <img src="/github/Welcome_screen.png?raw=true" alt="Crypter app icon">
</p>
# Crypter [![Build Status](https://travis-ci.org/HR/Crypter.svg?branch=master)](https://travis-ci.org/HR/Crypter) [![Coverage Status](https://coveralls.io/repos/github/HR/Crypter/badge.svg?branch=master)](https://coveralls.io/github/HR/Crypter?branch=master) [![Code Climate](https://codeclimate.com/github/HR/Crypter/badges/gpa.svg)](https://codeclimate.com/github/HR/Crypter) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Crypter is a simple, convenient and secure encryption client.
Simplifies password generation by deriving it using your MasterPassKey
(see Crypto).

This is based on [Crypto.Sync](https://github.com/HR/CryptoSync) (an end-to-end
cloud encryption client) which is a more elaborate implementation of the idea.
So check it out as well!

## Status
All of the UI and functionality has been implemented. All internal modules are
fully tested (100% coverage). Some end-to-end tests have been written (see
test/ui/test.js) but end-to-end testing is still mostly a WIP.
## Roadmap
Decryption and more functionality will be implemented very soon in the coming
releases. If you have any suggestions for features then please let me know!

## Screens (some of them)
<p align="center">
  <img src="/github/Crypter_screen.png?raw=true" alt="Crypter app icon" width="400">
  <img src="/github/MasterPass_screen.png?raw=true" alt="Crypter app icon" width="400">
</p>

## Crypto
> One key to to derive them all!

Crypter uses a MasterPass (obtained at setup) to derive a MasterPassKey using
the PBKDF2 key derivation algorithm from the MasterPass (see below for spec). It
then derives very secure encryption keys that are used for the encryption of
files from the MasterPassKey using the PBKDF2 key derivation algorithm again.
This method allows for the generation of very secure encryption keys for data
encryption.

```
// Crypto defaults
let defaults = {
  iterations: 50000, // file encryption key derivation iterations
  keyLength: 32, // encryption key length
  ivLength: 12, // initialisation vector length
  algorithm: 'aes-256-gcm', // encryption algorithm
  digest: 'sha256', // PBKDF2 hash function
  hash_alg: 'sha256', // default hashing function
  mpk_iterations: 100000 // MasterPassKey derivation iterations
}
```

## Dev

### Install (dependencies)
To install all dependencies run
```
$ npm install
```

### Run
Uses gulp for a few things so if you have not already, then install gulp
globally
```
$ gulp
```
### Test
Uses mainly mocha (+ chai) for testing. Since the project uses a lot of JS ES6
syntax, babel is used as a compiler
```
$ npm test
```
Uses istanbul for coverage
```
$ gulp coverage
```

### Build (for OSX)
To build the app for your OSX (darwin)
```
$ npm run xbuild
```
Since it is an Electron app so can be built for OS X, Linux, and Windows but has
currently only been tested on OSX.

## License
The MIT License (MIT)

Copyright (c) Habib Rehman (https://git.io/HR)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished todo so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
