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
  REPO: {
    URL: 'https://github.com/HR/Crypter/',
    FORK: 'https://github.com/HR/Crypter/fork',
    DOCS: 'https://github.com/HR/Crypter/blob/master/readme.md',
    REPORT_ISSUE: 'https://github.com/HR/Crypter/issues/new'
  },
  VIEWS: {
    BASE_URI: VIEWS_BASE_URI,
    MASTERPASSPROMPT: `${VIEWS_BASE_URI}/masterpassprompt.html`,
    SETUP: `${VIEWS_BASE_URI}/setup.html`,
    CRYPTER: `${VIEWS_BASE_URI}/crypter.html`,
    SETTINGS: `${VIEWS_BASE_URI}/settings.html`
  },
  CRYPTO: {
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
  REGEX: {
    APP_EVENT: /^app:[\w-]+$/i,
    ENCRYPTION_CREDS: /^Crypter(.*)$/igm,
    STRONGER_MASTERPASS: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@!%*#?&]).{8,}$/,
    MASTERPASS: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[$@!%*#?&]).{8,}$/

  },
  RESPONSES: {
    invalid: 'MUST CONTAIN 1 ALPHABET, 1 NUMBER, 1 SYMBOL AND BE AT LEAST 8 CHARACTERS',
    correct: 'CORRECT MASTERPASS',
    incorrect: 'INCORRECT MASTERPASS',
    setSuccess: 'MASTERPASS SUCCESSFULLY SET',
    empty: 'PLEASE ENTER A MASTERPASS',
    resetSuccess: 'You have successfully reset your MasterPass. You\'ll be redirected to verify it shortly.',
    exportSuccess: 'Successfully exported the credentials',
    importSuccess: 'Successfully imported the credentials. You will need to verify the MasterPass for the credentials imported so Crypter will relaunch shortly.'
  },
  ERRORS: {
    INVALID_MP_CREDS_FILE: 'Not a valid or corrupted Crypter credentials file!',
    INVALID_FILE: 'Not a valid or corrupted Crypter file!',
    AUTH_FAIL: 'Corrupted Crypter file or trying to decrypt on a different machine. See git.io/Crypter.info#faqs',
    PROMISE: 'Oops, we encountered a problem...',
    DECRYPT: 'Not a Crypter file (can not get salt, iv and authTag)',
    MS: {
      INVALID_FILE: 'Invalid tar header. Maybe the tar is corrupted or it needs to be gunzipped?',
      AUTH_FAIL: 'Unsupported state or unable to authenticate data'
    }
  },
  COLORS: {
    bad: '#9F3A38',
    good: '#2ECC71',
    highlight: '#333333'
  },
  SETTINGS: {
    RELAUNCH_TIMEOUT: 4000
  }
}