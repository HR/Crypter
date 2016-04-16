# Crypt
# [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Crypt is a simple, convenient and secure encryption client.  
Simplifies password generation by deriving it using your MasterPassKey
(see Crypto).
Since it is an Electron app so it is cross-platform but has currently only been
tested on OSX.

## Status
All of the UI and functionality has been implemented but tests are still being.

## Crypto
> One key to to derive them all!

Crypt uses a MasterPass (obtained at setup) to derive a MasterPassKey using the
PBKDF2 key derivation algorithm from the MasterPass (see below for spec). It
then derives unique encryption keys for every file to be encrypted from the
MasterPassKey. This method allows for the generation of very secure encryption keys than can be derived again using the 

```

```

## Dev

### Install (dependencies)
```
$ npm install
```

### Run
Uses gulp for a lot of things so if you have not already, then install gulp
globally
```
$ gulp
```

### Build
To build the app (compile into executable) for your platform
```
$ npm run build
```

Builds the app for OS X, Linux *, and Windows *.

\*(not tested yet)

## License
The MIT License (MIT)

Copyright (c) Habib Rehman (https://git.io/HR)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished TODO so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
