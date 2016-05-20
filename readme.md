<h1 align="center">
  <br>
  <a href="https://github.com/HR/Crypter"><img src="/res/app-icons/Crypter256.png" alt="Crypter" width="180" style= "margin-bottom: 1rem"></a>
  <br>
  Crypter
  <br>
  <br>
</h1>

<h4 align="center">A simple, convenient and secure encryption client.</h4>

<p align="center">
    <a href="https://travis-ci.org/HR/Crypter">
        <img src="https://travis-ci.org/HR/Crypter.svg?branch=master"
             alt="Travis Build">
    </a>
    <a href="https://coveralls.io/github/HR/Crypter?branch=master">
        <img src="https://coveralls.io/repos/github/HR/Crypter/badge.svg?branch=master"
             alt="Test Coverage">
    </a>
    <a href="https://coveralls.io/github/HR/Crypter?branch=master">
        <img src="https://codeclimate.com/github/HR/Crypter/badges/gpa.svg"
             alt="Codeclimate GPA">
    </a>
    <a href="http://standardjs.com/">
        <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg"
             alt="Standard JS Code Style">
    </a>
</p>
<br>

**Crypter** is a simple, convenient and secure encryption client.
It simplifies password generation by deriving it using your MasterPassKey (see Crypto).

This is based on [Crypto.Sync](https://github.com/HR/CryptoSync) (an end-to-end
cloud encryption client) which is a more elaborate implementation of the idea.
So check it out as well!

## Status
The decryption functionality is being implemented for the next major release
[v2.0](https://github.com/HR/Crypter/milestones/v2.0) in the "dev" branch. Feel
free to send PRs to speed this up! 

For the first release [v1.0](https://github.com/HR/Crypter/releases/tag/v1.0)
(on master branch), all of the UI and the encryption functionality has been
implemented.  All internal modules are fully tested (100% coverage). Some
end-to-end tests have been written (see test/ui/test.js) but end-to-end testing
is still mostly a WIP.

If you have any suggestions then please open an issue!

## Screens (some of them)
<p align="center">
  <img src="/github/Welcome_screen.png?raw=true" alt="Crypter app icon" width="100%">
  <img src="/github/Crypter_screen.png?raw=true" alt="Crypter app icon" width="40%">
  <img src="/github/MasterPass_screen.png?raw=true" alt="Crypter app icon" width="40%">
</p>

## Crypto
> One key to to derive them all!

Crypter uses a MasterPass (obtained at setup) to derive a MasterPassKey using
the PBKDF2 key derivation algorithm from the MasterPass (see below for spec). It
then derives very secure encryption keys that are used for the encryption of
files from the MasterPassKey using the PBKDF2 key derivation algorithm again.
This method allows for the generation of very secure encryption keys for data
encryption. Moreover, by just publicly storing the credentials used to
derive the MasterPassKey and the salts used to derive the encryption keys you
have the flexibility of deriving the encryption keys whenever you need to and
not having to worry about storing them securely. All you have to do is remember
your MasterPass.


Authentication is used by default since the AES-256-GCM symmetric block cipher
is used.

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

## Security
Crypter uses a WeakMap to store the MasterPassKey inside the MasterPassKey class
using closure function. This makes the MasterPassKey data held in the object
(externally) inaccessible to an extent which increases the protection of the
MasterPassKey. The MasterPassKey is never flushed to the filesystem and always
kept in (main) memory. Since JS does not give control over or allow such a
low-level operation as wiping memory, the program relies on the garbage
collection and volatility of the main memory for the permanent erasure of the
MasterPassKey stored in memory.

A decent number of iterations (see above specs) are used for the derivation of
the MasterPassKey to mitigate brute-force attacks. A good amount of iterations
are used for the derivation of the encryption keys from the MasterPasKey this is
so that performance and speed is not significantly compromised. For critical
application, you may choose to select 10,000,000 iterations instead (in
src/crypto.js). Refer to
http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf for
more info

## Dev
The "dev" branch is the development branch and may be unstable. However the
"master" branch will always be kept stable.  So issue pull requests for
improvements mainly on the dev branch.
### Install (dependencies)
To install all dependencies run
```
$ npm install
```

### Run
Uses gulp for a few things (so install gulp it globally if haven't already) and
so to start the app simply run
```
$ gulp
```
### Test
Uses mainly mocha (+ chai) for testing. Since the project uses a lot of JS ES6
syntax, babel is used as a compiler. To run all the tests
```
$ npm test
```
Uses istanbul for coverage. To run test coverage
```
$ gulp coverage
```

### Build
To build the app for your OSX (darwin)
```
$ npm run xbuild
```
To build the app for your Windows x84 and x64 (win32) run the win-build script
```
$ ./script/win-build.sh
```
Since it is an Electron app, it can be built for OS X, Linux, and Windows but
has currently only been tested on OSX.

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
