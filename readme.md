<h1 align="center">
  <br>
  <a href="https://github.com/HR/Crypter"><img src="./build/icons/256x256.png" alt="Crypter" width="180" style= "margin-bottom: 1rem"></a>
  <br>
  Crypter
  <br>
  <br>
</h1>


<h4 align="center">An innovative, convenient and secure crypto app.</h4>
<p align="center">
    <a href="https://github.com/HR/Crypter/releases/latest">
        <img src="https://img.shields.io/badge/Download-3.0-red.svg"
            alt="Download latest release" style= "margin-bottom: 0.5rem" height="25px">
    </a>
</p>

<p align="center">
    <a href="https://travis-ci.org/HR/Crypter">
        <img src="https://travis-ci.org/HR/Crypter.svg?branch=dev"
             alt="Travis Build">
    </a>
    <a href="https://ci.appveyor.com/project/HR/crypter">
        <img src="https://ci.appveyor.com/api/projects/status/4pa8cnlb1qnyj1xd/branch/dev?svg=true"
             alt="AppVeyor Build">
    </a>
    <a href="https://coveralls.io/github/HR/Crypter?branch=dev">
        <img src="https://coveralls.io/repos/github/HR/Crypter/badge.svg?branch=dev"
             alt="Test Coverage">
    </a>
    <a href="https://codeclimate.com/github/HR/Crypter?branch=dev">
        <img src="https://codeclimate.com/github/HR/Crypter/badges/gpa.svg"
             alt="CodeClimate GPA">
    </a>
    <a href="http://standardjs.com/">
        <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg"
             alt="Standard JS Code Style">
    </a>
</p>
<br>

> Encrypt unlimited bits. Remember only a bit.

**Crypter** is an innovative, convenient and secure cross-platform crypto app
that simplifies secure password generation and management by requiring you to
only remember one bit, the MasterPass.

This is based on [Crypto.Sync](https://github.com/HR/CryptoSync) (an end-to-end
cloud encryption client) which is a more elaborate implementation of the idea.
So please check it out as well!

Link to this README: https://git.io/Crypter.info


## Installation
All prebuilt binaries for all major platforms are available under
[releases](https://github.com/HR/Crypter/releases/latest).

Crypter is also available to install via [Homebrew Cask](http://caskroom.io) for
macOS, simply run the following command in the Terminal
```bash
$ brew update && brew cask install crypter
```
<br/>

## Status
[Crypter v3.0](https://github.com/HR/Crypter/releases/tag/v3.0.0) is a fully
fledged crypto app that can decrypt and encrypt any arbitrary data. This version
has been released and fully tested for macOS (OSX), Linux (for all distros via
[AppImage](http://appimage.org/)) and Windows (32 & 64 bit). All core modules
(modules that provide the core functionality) are fully tested (90%+ coverage).
Some end-to-end tests have been written but end-to-end testing is still mostly a
WIP.

The next major release is [v3.1](https://github.com/HR/Crypter/milestones/v3.1)
and any work for it is done on the "dev" branch. All features to be implemented
for the next major version can be found at
https://github.com/HR/Crypter/milestones/v3.1. Feel free to send PRs to speed
this up!

If you have any suggestions then please open an issue!

<br/>

## Screens (some of them)
<p align="center">
  <img src="/.github/Welcome_screen.png?raw=true" alt="Welcome screen" width="100%">
  <img src="/.github/Crypter_main_screen.png?raw=true" alt="Crypter screen" width="40%">
  <img src="/.github/MasterPass_screen.png?raw=true" alt="MasterPass screen" width="40%">
  <img src="/.github/Settings_screen.png?raw=true" alt="Settings screen" width="85%">
</p>

<br/>

## Crypto
> One key to derive them all!

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

Crypter never ever directly uses your MasterPass to encrypt anything but instead
derives a MasterPassKey from it which it then uses to derive the encryption key
(which is used directly to encrypt your file). Every time a file is decrypted,
the encryption key is re-derived from the MasterPassKey. Every time you set the
MasterPass through the setup or reset it (through Verify MasterPass), the
MasterPassKey is derived from the MasterPass using a newly generated set of
(random) credentials. These credentials are used to re-derive the MasterPassKey
every time the Crypter is executed (i.e. the app is launched).

Authentication is used by default since the AES-256-GCM symmetric block cipher
is used. This ensures data integrity is verified on decryption and allowing the
detection of tampering or data corruption.

The following are the crypto defaults and can be found under ```app/config.js```
```js
// Crypto defaults
{
  ITERATIONS: 50000, // file encryption key derivation iterations
  KEYLENGTH: 32, // encryption key length
  IVLENGTH: 12, // initialisation vector length
  ALGORITHM: 'aes-256-gcm', // encryption algorithm
  DIGEST: 'sha256', // digest function
  HASH_ALG: 'sha256', // hashing function
  MPK_ITERATIONS: 100000 // MasterPassKey derivation iterations
}
```

### Encryption process
When encrypting a file, Crypter first creates a temporary hidden directory,
namely '.crypting'. It then encrypts the user selected file with the crypto
defaults and flushes the encrypted data to a file in the directory, namely
'data'. Furthermore, it writes the public credentials to a file within the same
directory, namely 'creds'. Finally, Crypter compresses the directory to a tar
archive with the name of the user selected file and the '.crypto' extension
appended to it.

### Decryption process
The decryption process is essentially the inverse of the encryption process
where the temporary hidden directory is named '.decrypting'. The credentials are
read from the creds file and used to decrypt the data file to the original user
file with its original extension which is deduced from the CRYPTO file name
(e.g. extension for "file.txt.crypto" would be ".txt").

### Public credentials
Certain credentials are required to decrypt the encrypted data as they are
needed to reconstruct the particular encryption key and verify data integrity.
These can be stored publicly without compromising security as it is fairly
impossible (by current standards) to reconstruct the encryption key without the
MasterPass and its credentials. The credentials are stored in the creds file of
the [CRYPRO file](#crypto-file) archive (as delineated above) in the following
format:
```
Crypter#iv#authTag#salt
```

<br/>

## CRYPTO file

### Format
A CRYPTO file is the product of the Crypter encryption process. It stores both
the encrypted version of the user file and the public credentials used to
encrypt it (and needed to decrypt it). It has a ```.crypto``` file extension
which is appended to the full file name (including the extension) of the file
originally encrypted. The file itself it is a tar archive in the following
structure:
```c
someFile.crypto
├── data // the encrypted version of the user selected file
└── creds // the public credentials used to encrypt it
```

### Reusing the same MasterPass
You may try to decrypt a CRYPTO file with the same
MasterPass<sup>[1](#same-masterpass)</sup> set that you used while encrypting it
but the MasterPass is being reused. This means that it has either been _reset to
the same MasterPass (was previously different)_ or _set the same MasterPass on
Crypter on a different machine (see [portability](#portability))_. If this is
the case then you most probably will come across the following error:
```
ERROR: Unsupported state or unable to authenticate data
```
What happens is that the MasterPassKey originally used to derive the encryption
key on is **not the same** as the MasterPassKey derived with the reused
MasterPass because the set of credentials generated with the original MasterPass
is **different** (due to randomness). As a result your encryption key that is
derived from the MasterPassKey is different and so incorrect which yields the
error.

See [Achieving portability and same MasterPass reuse](#achieving-portability-and-same-masterpass-reuse)
for instructions on how to successfully reuse the same MasterPass.

### Portability
When you encrypt a CRYPTO file on one machine with Crypter and try to decrypt it
with Crypter running on a different machine with the same
MasterPass<sup>[1](#same-masterpass)</sup> then you most probably will come
across the following error:
```
ERROR: Unsupported state or unable to authenticate data
```
What happens is that the MasterPassKey originally used to derive the encryption
key on one machine is **not the same** as the MasterPassKey derived on a
different machine because the set of credentials generated on the other machine
is **different** (due to randomness). As a result your encryption key that is
derived from the MasterPassKey is different and so incorrect which yields the
error. See the subsequent section on how to achieve full portability between
multiple machines.

To achieve portability the set of (MasterPassKey) credentials need to be
exported from Crypter on the source machine<sup>[2](#source)</sup> and imported
into Crypter on the target machine<sup>[3](#target)</sup> that you wish to
decrypt the CRYPTO file.

See [Achieving portability and same MasterPass reuse](#achieving-portability-and-same-masterpass-reuse)
for instructions on how to successfully achieve CRYPTO file portability.

### Achieving portability and same MasterPass reuse
This can be achieved in two simple steps:

<ol>
  <li><a href="#how-do-i-export-my-masterpass-credentials">Export MasterPass credentials on the source machine</a><sup><a href="#source">2</a></sup></li>
  <li><a href="#how-do-i-import-my-masterpass-credentials">Import the MasterPass on the target machine</a><sup><a href="#target">3</a></sup></li>
</ol>

Refer to the FAQs for instructions on how to perform the above steps.

<hr>

<sub><a name="same-masterpass"></a> [1] Refers to the MasterPass that was set in
Crypter at the time the CRYPTO file was encrypted (i.e. the correct
MasterPass).</sub>

<sub><a name="source"></a> [2] The machine on which it was originally encrypted
on with the original MasterPass used.</sub>

<sub><a name="target"></a> [3] The machine on which you wish to decrypt the
CRYPTO file on.</sub>

<br/>

## Security

### Security-first practice
Crypter follows a security-first practice. This means that security is the
highest priority and first consideration. This means that, while Crypter seeks
to make encryption more convenient, Crypter chooses a convenient trade-off over
a higher level of security.

### MasterPass
Crypter never stores your MasterPass in memory nor on the filesystem. This
substantially improves the security of you MasterPass. You are only asked to
enter the MasterPass when you first set, reset or verify it. Whenever you enter
your MasterPass, Crypter derives a MasterPassKey (using a set of generated
credentials) and discards the MasterPass. The derived MasterPassKey is
indistinguishable from the MasterPass and cannot be used in any way to derive
the MasterPass (as it is derived from a one-way function). The MasterPassKey is
then securely stored in main memory and used to derive the encryption keys.

### MasterPassKey
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
app/core/crypto.js). Refer to
http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf for
more info

Crypter generates a new set of random credentials for deriving the MasterPassKey
every time the MasterPass is set (at setup) or reset. Using randomness, mitigate
brute-force attacks which drastically improves security.

<br/>

## FAQs

### How do I encrypt a file?
After walking through the setup, you should have a MasterPass set. Launch
Crypter and verify it. After doing so successfully, you should get the main
Crypter window. Here you simply drop or select the file you want to encrypt and
after a few seconds...it's done! You should see all the information about file
and the encryption such as the encryption key and path of the encrypted file in
a new screen.

### How do I decrypt a CRYPTO file?
> The following instructions assume that the CRYPTO file that you wish to
decrypt is being used with the same MasterPass that you set at setup and you
have not reset it ever since. If this is not the case (i.e. you have reset the
MasterPass or reset it back to the original) then refer to [portability](#portability)

Launch Crypter and verify it. After doing so successfully, you should get the
main Crypter window. Here you simply drop or select the file you want to decrypt
and after a few seconds...it's done! You should see all the information about
file and the original encryption such as the encryption key and path of the
decrypted file in a new screen. By default, the decrypted file has "Decrypted"
with a space prepended to its file name with the original extension.

### Can not decrypt a CRYPTO file on a different machine with the same MasterPass?
Refer to [Portability](#portability) and [Achieving portability and same MasterPass reuse](#achieving-portability-and-same-masterpass-reuse)

### Can not decrypt a CRYPTO file with the same MasterPass?
Refer to [Reusing the same MasterPass](#reusing-the-same-masterpass) and [Achieving portability and same MasterPass reuse](#achieving-portability-and-same-masterpass-reuse)

### Where do my files get encrypted/decrypted to?
By default, every source file you encrypt or decrypt gets encrypted or decrypted
(respectively) to the same directory where the source file is located.

### How do I access the Crypter settings?
Access the Crypter setting by either clicking on the cog icon in the main
Crypter window or going to  ```Crypter > Preferences...``` from the menu.

### How do I reset my MasterPass?
Reset your MasterPass by first clicking on the "Forgot it" link in the Verify
MasterPass window. This takes you to a new screen where you enter a new valid
MasterPass. Once you've entered it, click the 'Reset' button and you'll be sent
back to the verify screen where you verify it and your done! :).

### What is a valid MasterPass?
Crypter checks for a valid MasterPass when set and won't allow you to set an
invalid one. A MasterPass is valid when it adheres to the following rules:

- It is at least 8 characters long
- It has at least one alphabet character (A-Z, a-z)
- It has at least one number character (0-9)
- It has at least one special character ($@!%\*#?&)

These rules are enforced via the following regular expression:
```javascript
/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[$@!%*#?&]).{8,}$/
```
### What are MasterPass credentials?
MasterPass credentials are a set of values that are required to derive the
MasterPassKey from the MasterPass. The values have a pseudo-random element and
are cryptographically linked. Every MasterPass set or reset with Crypter has a
unique set of MasterPass credentials which yield a different MasterPassKey even
if any number of the MasterPass are the same.

### How do I export my MasterPass credentials?
To export the MasterPass credentials, you have to first open the Crypter
settings (see above). From the settings, click on the "Export" button. A select
folder dialog should appear from which select the folder that you wish to export
the credentials to. Finally, you should see the a success message to confirm
successful export. The exported MasterPass credentials file is always named ```credentials.crypter```.

### How do I import my MasterPass credentials?
To export the MasterPass credentials, assuming that you have already
successfully exported them, you have to first open the Crypter settings (see
above). From the settings, click on the "Import" button. A select file dialog
should appear from which locate your ```credentials.crypter``` file and select
it. You should see the a success message to confirm successful import shortly
after which you will have to verify the MasterPass for the credentials.

NOTE: while Crypter does not require the MasterPass credentials file to be
exactly named ```credentials.crypter```, it does require the file's contents to
be unaltered from when it was exported from Crypter. If it has been altered then
the import may fail.

<br/>

## Development
The "dev" branch is the development branch and may be unstable. However the
"master" branch will always be kept stable.  So issue pull requests for
improvements mainly on the dev branch.

### Configurations
All major configurations that you can do are found under ```app/config.js```.
This includes changing the crypto settings. But be advised that doing so may
break functionality and certainly risks [portability](#portability).

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
syntax, babel is used as a transpiler. To run all the tests
```
$ npm test
```
Uses istanbul for coverage. To run test coverage
```
$ gulp coverage
```

### Build
Binaries (available under releases) have been build using Electron ```v1.1.3```.
Crypter uses electron-builder to build binaries so install it globally first
prior to any build
```
$ npm install electron-builder@next -g
```
The following instructions are for building Crypter on and for the respective
platform stated

To build the app for your **macOS**
```
$ build -m
```
To build the app for your **Linux**
```
$ sudo apt-get install --no-install-recommends -y icnsutils graphicsmagick xz-utils
$ build -l --x64 --ia32
```
To build the app for your **Windows** x84 and/or x64
```
$ build -w --x64 --ia32
```


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
