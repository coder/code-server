var native = require('crypto')

var checkParameters = require('./lib/precondition')
var defaultEncoding = require('./lib/default-encoding')
var toBuffer = require('./lib/to-buffer')

function nativePBKDF2 (password, salt, iterations, keylen, digest, callback) {
  checkParameters(iterations, keylen)
  password = toBuffer(password, defaultEncoding, 'Password')
  salt = toBuffer(salt, defaultEncoding, 'Salt')

  if (typeof digest === 'function') {
    callback = digest
    digest = 'sha1'
  }
  if (typeof callback !== 'function') throw new Error('No callback provided to pbkdf2')

  return native.pbkdf2(password, salt, iterations, keylen, digest, callback)
}

function nativePBKDF2Sync (password, salt, iterations, keylen, digest) {
  checkParameters(iterations, keylen)
  password = toBuffer(password, defaultEncoding, 'Password')
  salt = toBuffer(salt, defaultEncoding, 'Salt')
  digest = digest || 'sha1'
  return native.pbkdf2Sync(password, salt, iterations, keylen, digest)
}

/* istanbul ignore next */
if (!native.pbkdf2Sync || native.pbkdf2Sync.toString().indexOf('keylen, digest') === -1) {
  exports.pbkdf2Sync = require('./lib/sync')
  exports.pbkdf2 = require('./lib/async')

// native
} else {
  exports.pbkdf2Sync = nativePBKDF2Sync
  exports.pbkdf2 = nativePBKDF2
}
