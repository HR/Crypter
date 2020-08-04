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
        <img src="https://img.shields.io/badge/Download-4.0-orange.svg"
            alt="Download latest release" style= "margin-bottom: 0.5rem" height="25px">
    </a>
</p>

<p align="center">
    <a href="http://standardjs.com/">
        <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg"
             alt="Standard JS Code Style">
    </a>
    <a href="https://travis-ci.org/HR/Crypter">
        <img src="https://travis-ci.org/HR/Crypter.svg?branch=master"
             alt="Travis Build">
    </a>
    <a href="https://ci.appveyor.com/project/HR/crypter">
        <img src="https://ci.appveyor.com/api/projects/status/4pa8cnlb1qnyj1xd/branch/master?svg=true"
             alt="AppVeyor Build">
    </a>
    <a href="https://coveralls.io/github/HR/Crypter?branch=master">
        <img src="https://coveralls.io/repos/github/HR/Crypter/badge.svg?branch=master"
             alt="Test Coverage">
    </a>
    <a href="https://codeclimate.com/github/HR/Crypter?branch=master">
        <img src="https://codeclimate.com/github/HR/Crypter/badges/gpa.svg"
             alt="CodeClimate GPA">
    </a>
    <a href="https://github.com/HR/Crypter/releases/latest">
        <img src="https://get-badge.herokuapp.com/HR/Crypter/total"
             alt="Downloads">
    </a>
</p>
<br>

> Encrypt unlimited bits. Remember only a bit.

**Crypter** is a cross-platform crypto app that makes encryption and decryption
convenient while still upholding strong security. It tackles one of the weakest
links in most security systems today - weak passwords. It simplifies secure
password generation and management and requires you to only remember one bit -
your MasterPass.

[Crypter v4.0](https://github.com/HR/Crypter/releases/tag/v4.0.0) is a crypto
app that can decrypt and encrypt any arbitrary data this includes files and
folders. This version has been released and fully tested for macOS (OSX), Linux
(for all distros via [AppImage](http://appimage.org/)) and Windows (32 & 64
bit). All core modules (modules that provide the core functionality) are fully
tested (90%+ coverage).

Please open an issue if you have any suggestions and add improvements via PRs!

Also checkout [Ciphora](https://github.com/HR/ciphora) (https://github.com/HR/ciphora)
a decentralized end-to-end encrypted messaging app.

Link to this README: https://git.io/Crypter.info

---

# Contents

<!-- TOC depthFrom:2 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [Installation](#installation)
- [Screens](#screens)
- [Crypto](#crypto) - [Encryption process](#encryption-process) - [Decryption process](#decryption-process) - [Public credentials](#public-credentials)
- [CRYPTO file](#crypto-file) - [Format](#format) - [Reusing the same MasterPass](#reusing-the-same-masterpass) - [Achieving portability and same MasterPass reuse](#achieving-portability-and-same-masterpass-reuse)
- [Security](#security) - [Security-first practice](#security-first-practice) - [MasterPass](#masterpass) - [MasterPassKey](#masterpasskey)
- [FAQs](#faqs) - [How do I encrypt a file or folder?](#how-do-i-encrypt-a-file-or-folder) - [How do I decrypt a CRYPTO file?](#how-do-i-decrypt-a-crypto-file) - [How do I encrypt multiple files?](#how-do-i-encrypt-multiple-files) - [Why am I getting the "Corrupted Crypter file or trying to decrypt on a different machine." error?](#why-am-i-getting-the-corrupted-crypter-file-or-trying-to-decrypt-on-a-different-machine-error) - [Why can't I decrypt a CRYPTO file on a different machine with the same MasterPass?](#why-cant-i-decrypt-a-crypto-file-on-a-different-machine-with-the-same-masterpass) - [Why can't I decrypt a CRYPTO file with the same MasterPass?](#why-cant-i-decrypt-a-crypto-file-with-the-same-masterpass) - [Where are my encrypted/decrypted files/folders placed?](#where-are-my-encrypteddecrypted-filesfolders-placed) - [How can I access Crypter's preferences?](#how-can-i-access-crypters-preferences) - [How can I reset my MasterPass?](#how-can-i-reset-my-masterpass) - [What is a valid MasterPass?](#what-is-a-valid-masterpass) - [What are MasterPass credentials?](#what-are-masterpass-credentials) - [How can I export my MasterPass credentials?](#how-can-i-export-my-masterpass-credentials) - [How can I import my MasterPass credentials?](#how-can-i-import-my-masterpass-credentials)
- [Development](#development) - [Configurations](#configurations) - [Install (dependencies)](#install-dependencies) - [Run](#run) - [Test](#test) - [Build](#build)
- [License](#license)

## <!-- /TOC -->

## Installation

All prebuilt binaries for all major platforms are available under
[releases](https://github.com/HR/Crypter/releases/latest).

Crypter is also on [Homebrew Cask](https://formulae.brew.sh/cask/crypter) for
macOS. So to install it, simply run the following command in the Terminal:

```bash
$ brew cask install crypter
```

<br/>

## Screens

<p align="center">
  <img src="/.github/Welcome_screen.png?raw=true" alt="Welcome screen" width="100%">
  <img src="/.github/Crypter_main_screen.png?raw=true" alt="Crypter screen" width="40%">
  <img src="/.github/MasterPass_screen.png?raw=true" alt="MasterPass screen" width="40%">
  <img src="/.github/Settings_screen.png?raw=true" alt="Settings screen" width="85%">
</p>

<br/>

## Crypto

> One key to derive them all!

Crypter derives a MasterPassKey from the MasterPass obtained at setup by using
the PBKDF2 key derivation algorithm (see below for the specification). It
then uses PBKDF2 to derive a number of encryption keys from the MasterPassKey
that can be used for the encryption of files. This method allows for the
generation of very secure encryption keys for data encryption. Moreover, by
publicly storing the credentials used to derive the MasterPassKey and the salts
used to derive the encryption keys, you are able to produce the encryption keys
at will and without needing to store them securely. Your MasterPass is the only
thing that you need to remember.

Crypter never directly encrypts anything with your MasterPass. Instead, it
derives a MasterPassKey from it, which it then uses to derive the
encryption key used to encrypt your file. Every time a file is decrypted,
the encryption key is re-derived from the MasterPassKey. Every time you set the
MasterPass through the setup or reset it through Verify MasterPass, the
MasterPassKey is derived from the MasterPass using a newly generated set of
(random) credentials. These credentials are used to re-derive the MasterPassKey
every time that Crypter is executed (i.e. the app is launched).

Authentication with the AES-256-GCM symmetric block cipher is used by default.
This ensures that data integrity is verified on decryption and allows the app
to detect tampering or data corruption.

The following are the crypto defaults and can be found under `app/config.js`:

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
namely '.crypting'. It then encrypts the user-selected file with the crypto
defaults and flushes the encrypted data to a file in the directory, namely
'data'. If it is a directory then it is compressed first (tar). It also writes
the public credentials to a file within the same directory, namely 'creds'.
Finally, Crypter compresses the directory to a tar archive with the name of the
user-selected file and the '.crypto' extension appended to it.

### Decryption process

The decryption process is essentially the inverse of the encryption process.
During decryption, Crypter creates a temporary hidden directory named
'.decrypting'. It then reads the credentials from the creds file and decrypts
the data file into the original file or directory (after decompressing it) with
its original name and extension, as deduced from the CRYPTO file name (e.g. the
extension for "file.txt.crypto" would be ".txt").

### Public credentials

Certain credentials are required to decrypt the encrypted data. These are
needed to reconstruct the particular encryption key and to verify data integrity.
These can be stored publicly without compromising security since it is fairly
impossible (by current standards) to reconstruct the encryption key without the
MasterPass and its credentials. These credentials are stored in the creds file of
the [CRYPTO file](#crypto-file) archive (as delineated above) in the following
format:

#### v1

```
Crypter#iv#authTag#salt#dir
```

#### v2

Uses JSON

```json
{
  "type": "CRYPTO",
  "iv": "...",
  "authTag": "...",
  "salt": "...",
  "isDir": true || false
}
```

The `dir` part is only included for directories
<br/>

## CRYPTO file

### Format

A CRYPTO file is the product of the Crypter encryption process. This file
stores both the encrypted version of the user file and the public credentials
needed to encrypt and decrypt it. It has a `.crypto` file extension, which
is appended to the full file name (including the extension) of the file
originally encrypted. The file itself is a tar archive in the following
structure:

```c
someFile.crypto
├── data // the encrypted version of the user selected file
└── creds // the public credentials used to encrypt it
```

### Reusing the same MasterPass

If you attempt to decrypt a CRYPTO file by _resetting to a specific
MasterPass_ or _setting an identical MasterPass on a different machine_,
you will likely encounter the following error:

```
ERROR: Unsupported state or unable to authenticate data
```

This issue occurs because the MasterPassKey that was originally used to
derive the encryption key on is **not the same** as the MasterPassKey
derived with the reused MasterPass. Since Crypter uses randomness to
generate secure credentials, this second set of credentials will be quite
**different** from the original set. As a result, the derived encryption key is
incorrect and yields this error.

See [Achieving portability and same MasterPass reuse](#achieving-portability-and-same-masterpass-reuse)
for instructions on how to successfully reuse the same MasterPass.

### Achieving portability and same MasterPass reuse

To achieve portability on Crypter, the set of MasterPassKey credentials
need to be exported from Crypter on the source machine<sup>[1](#source)</sup>
and imported into Crypter on the target machine<sup>[2](#target)</sup>.

This can be achieved in two simple steps:

<ol>
  <li><a href="#how-can-i-export-my-masterpass-credentials">Export MasterPass credentials on the source machine</a><sup><a href="#source">1</a></sup></li>
  <li><a href="#how-can-i-import-my-masterpass-credentials">Import MasterPass credentials on the target machine</a><sup><a href="#target">2</a></sup></li>
</ol>

Please refer to the FAQs for instructions on how to perform the above steps.

<hr>

<a name="source"></a> [1] The machine where the CRYPTO file was initially
encrypted.

<a name="target"></a> [2] The machine where you wish to decrypt the CRYPTO
file.

<br/>

## Security

### Security-first practice

Crypter follows a security-first practice. This means that security is its
highest priority and first consideration. Thus, while Crypter seeks
to make encryption more convenient, it always defers to maintaining
a high level of security.

### MasterPass

Crypter never stores your MasterPass in memory or on the filesystem. This
substantially improves the security of your MasterPass. You are only asked to
enter the MasterPass when you first set, reset or verify it. Whenever you enter
your MasterPass, Crypter derives a MasterPassKey (using a set of generated
credentials) and then immediately discards the MasterPass. The MasterPassKey is
then securely stored in memory and used to derive the encryption keys. Since
these credentials are derived via a one-way function, they cannot be used in
any way to derive the MasterPass.

### MasterPassKey

Crypter uses a WeakMap to store the MasterPassKey inside the MasterPassKey class
using a closure function. This makes the MasterPassKey data held in the object
(externally) inaccessible, consequently increasing the protection of the
MasterPassKey. The MasterPassKey is never flushed to the filesystem and is always
stored in (main) memory. Since JS does not give control over or allow such a
low-level operation as wiping memory, the program relies on the garbage
collection and volatility of the main memory for the permanent erasure of the
MasterPassKey stored in memory.

A decent number of iterations (see the above specifications) are used in the
derivation of the MasterPassKey to mitigate brute-force attacks. A good
amount of iterations are also used during the derivation of the encryption
keys from the MasterPassKey. Consequently, performance and speed are not
significantly compromised. For critical applications, you may choose to
select 10,000,000 iterations instead of the default number
(in app/core/crypto.js). Please refer to
http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf for
more information.

Crypter generates a new set of random credentials for deriving the MasterPassKey
every time the MasterPass is set (at setup) or reset. Crypter employs randomness
to mitigate brute-force attacks and thus drastically improve security.

<br/>

## FAQs

### How do I encrypt a file or folder?

If you haven't already, walk through the setup and set your MasterPass.
To encrypt a file or folder, first launch Crypter and verify your MasterPass.
After doing so successfully, you will see the main Crypter window with an orange
area. Here, you can simply drag-and-drop or click to select the file/folder you
wish to encrypt. Once Crypter is done encrypting your file/folder, it will show
you the encryption information (i.e. the encryption key and the path of the
encrypted file) in a new window. To encrypt another file/folder simply click the
back arrow at the bottom left and start-over ;)

### How do I decrypt a CRYPTO file?

> The following instructions assume that the CRYPTO file that you wish to
> decrypt is being used with the same MasterPass that you set at setup and also
> that you have not reset it since that time. If this is not the case, please refer
> to [Reusing the same MasterPass](#reusing-the-same-masterpass).

To decrypt a CRYPTO file, first launch Crypter and verify your MasterPass. After
doing so successfully, you will see the main Crypter window with an orange area.
Here, you can simply drag-and-drop or click to select the CRYPTO file that you
wish to decrypt. After a few seconds, the process will complete and you will see
some information about the file and its original encryption in a new window. By
default, the decrypted file has the same name as the name of the original file
(i.e. the encrypted file name without the `.crypto` at the end).

### How do I encrypt multiple files?

Crypter can encrypt an entire folder so you can put them in a folder or,
alternatively, compress them into an archive (like a `.zip`) and then just pass
it to Crypter ;)

### Why am I getting the "Corrupted Crypter file or trying to decrypt on a different machine." error?

This error means that either your Crypter file (i.e. the `data` file) is
corrupt/tempered, that you are on a different machine than the one originally
used to encrypt the file or that you have previously reset your MasterPass.
For the last two cases, please refer to
[Reusing the same MasterPass](#reusing-the-same-masterpass) and
[Achieving portability and same MasterPass reuse](#achieving-portability-and-same-masterpass-reuse).

### Why can't I decrypt a CRYPTO file on a different machine with the same MasterPass?

Please refer to [Reusing the same MasterPass](#reusing-the-same-masterpass) and
[Achieving portability and same MasterPass reuse](#achieving-portability-and-same-masterpass-reuse)

### Why can't I decrypt a CRYPTO file with the same MasterPass?

Please refer to [Reusing the same MasterPass](#reusing-the-same-masterpass) and
[Achieving portability and same MasterPass reuse](#achieving-portability-and-same-masterpass-reuse)

### Where are my encrypted/decrypted files/folders placed?

By default, every source file that you encrypt/decrypt gets encrypted/decrypted
to the same directory where the source file is located.

### How can I access Crypter's preferences?

You can access Crypter's preferences by either clicking on the cog icon in the
main Crypter window or by going to `Crypter > Preferences...` from the menu.

### How can I reset my MasterPass?

You can reset your MasterPass by clicking on the "Forgot it" link in the Verify
MasterPass window. This takes you to a new screen where you can enter a new, valid
MasterPass. Once you've entered it, click the 'Reset' button and you'll be sent
back to the verify screen where you can verify your new MasterPass.

### What is a valid MasterPass?

Crypter will not allow you to set an invalid MasterPass. A MasterPass is valid
when it adheres to the following rules:

- It is at least 8 characters long
- It has at least one uppercase alphabetic character (A-Z)
- It has at least one lowercase alphabetic character (a-z)
- It has at least one numeric character (0-9)
- It has at least one special character (\$@!%\*#?&)

These rules are enforced via the following regular expression:

```javascript
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@!%*#?&]).{8,}$/;
```

### What are MasterPass credentials?

MasterPass credentials are a set of values that are required to derive the
MasterPassKey from the MasterPass. These values have a pseudo-random element and
are cryptographically linked. Every MasterPass that is set or reset with Crypter
has a unique set of MasterPass credentials. These yield a distinct MasterPassKey,
even when a MasterPass is reused.

### How can I export my MasterPass credentials?

To export your MasterPass credentials, you can first open Crypter's
preferences (see above). From this screen, click on the "Export" button. A
dialog will appear from which you can select the folder where you wish to export
the credentials. A success message will confirm a successful export. The
exported MasterPass credentials file is always named `credentials.crypter`.

### How can I import my MasterPass credentials?

To import a set of MasterPass credentials, you can first open Crypter's
preferences (see above). From this screen, click on the "Import" button. A
dialog will appear from which you can locate your `credentials.crypter` file.
After you select it, a success message will confirm a successful import and
you will have to verify the MasterPass for the credentials.

NOTE: while Crypter does not require the MasterPass credentials file to be
exactly named `credentials.crypter`, it does require the file's contents to
be unaltered from when it was exported from Crypter. If it has been altered,
the import may fail.

<br/>

## Development

Crypter is developed in the "dev" branch, which may be unstable at times.
This branch should typically be used for pull requests.

The "master" branch will always be kept stable.

### Configurations

All major configurations that you can apply are found under `app/config.js`.
This includes changes to certain cryptography settings. Please be advised
that altering these may break functionality and
[portability](#achieving-portability-and-same-masterpass-reuse).

### Install (dependencies)

To install all dependencies, run:

```
$ yarn install
```

### Run

Since Crypter uses gulp, please install it globally if you have not already
done so. To start Crypter, run:

```
$ gulp
```

### Test

Crypter primarily uses mocha and chai for testing. Since the project uses a
lot of JS ES6 syntax, babel is also used as a transpiler. To run all the tests,
execute:

```
$ yarn test
```

Crypter uses istanbul for coverage. To run test coverage, execute:

```
$ yarn run coverage
```

### Build

Crypter's binaries (available under releases) have been built using
Electron. Since Crypter uses electron-builder to build binaries,
you must install it globally:

```
$ npm install electron-builder@next -g
```

To build the app for **macOS**, run:

```
$ yarn run build:mac
```

To build the app for **Linux**, run:

```
$ sudo apt-get install --no-install-recommends -y icnsutils graphicsmagick xz-utils
$ yarn run build:lin
```

To build the app for **Windows** x84 and/or x64, run:

```
$ yarn run build:win
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
