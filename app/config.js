'use strict'
/**
 * config.js
 * Provides all essential config constants
 ******************************/
 // const {app} = require('electron')
 // Fixed constants
const ICONS_BASE_PATH = `${__dirname}/static/images/icons`
const VIEWS_BASE_URI = `file://${__dirname}/static`

module.exports = {
  CRYPTO: {
    ENCRYPTION_CREDS_REGEX: /^Crypter(.*)$/igm,
    ENCRYPTION_TMP_DIR: '.crypting',
    DECRYPTION_TMP_DIR: '.decrypting',
    FILE_DATA: 'data',
    FILE_CREDS: 'creds',
    MASTERPASS_CREDS_FILE: 'credentials.crypter',
    MASTERPASS_CREDS_PROPS: ['mpkhash', 'mpksalt', 'mpsalt'],
    DECRYPT_OP: 'Decrypted',
    DECRYPT_TITLE_PREPEND: 'Decrypted ',
    ENCRYPT_OP: 'Encrypted',
    EXT: '.crypto',
    DEFAULTS: { // Crypto default constants
      ITERATIONS: 50000, // file encryption key derivation iterations
      KEYLENGTH: 32, // encryption key length
      IVLENGTH: 12, // initialisation vector length
      ALGORITHM: 'aes-256-gcm', // encryption algorithm
      DIGEST: 'sha256', // digest function
      HASH_ALG: 'sha256', // hashing function
      MPK_ITERATIONS: 100000 // MasterPassKey derivation iterations
    }
  },
  VIEWS: {
    BASE_URI: VIEWS_BASE_URI,
    MASTERPASSPROMPT: `${VIEWS_BASE_URI}/masterpassprompt.html`,
    SETUP: `${VIEWS_BASE_URI}/setup.html`,
    CRYPTER: `${VIEWS_BASE_URI}/crypter.html`,
    SETTINGS: `${VIEWS_BASE_URI}/settings.html`
  },
  REPO: {
    URL: 'https://github.com/HR/Crypter/',
    FORK: 'https://github.com/HR/Crypter/fork',
    DOCS: 'https://github.com/HR/Crypter/blob/master/readme.md',
    REPORT_ISSUE: 'https://github.com/HR/Crypter/issues/new'
  },
  ERRORS: {
    INVALID_MASTERPASS_CREDS_FILE: 'Not a valid Crypter credentials file!',
  },
  ICONS: {
    BASE_PATH: ICONS_BASE_PATH,
    CRYPTER: `${ICONS_BASE_PATH}/Crypter.svg`,
    CRYPTED: `${ICONS_BASE_PATH}/crypt.svg`,
    MASTERPASS: `${ICONS_BASE_PATH}/masterpass.svg`,
    DECRYPTED: `${ICONS_BASE_PATH}/Decrypted.svg`,
    ENCRYPTED: `${ICONS_BASE_PATH}/Encrypted.svg`,
    DONE: `${ICONS_BASE_PATH}/done.svg`,
    INFO: `${ICONS_BASE_PATH}/info.svg`,
    BACK: `${ICONS_BASE_PATH}/back.svg`,
    SETTINGS: `${ICONS_BASE_PATH}/settings.svg`,
    UPDATE: `${ICONS_BASE_PATH}/package.svg`,
    HEART: `${ICONS_BASE_PATH}/heart.svg`,
    CODE: `${ICONS_BASE_PATH}/code.svg`,
    GITHUB: `${ICONS_BASE_PATH}/mark-github.svg`,
    STAR_REPO: `${ICONS_BASE_PATH}/star.svg`,
    OPEN_ISSUE: `${ICONS_BASE_PATH}/issue-opened.svg`,
    FORK_REPO: `${ICONS_BASE_PATH}/repo-forked.svg`
  },
  SETTINGS: {
    RELAUNCH_TIMEOUT: 4000
  }
}