var createHash = require('crypto').createHash
var stringify = require('fast-safe-stringify')

module.exports = function shasum (input, hash, digest) {
  if (!hash) hash = 'sha1'
  if (!digest) digest = 'hex'
  if (typeof input !== 'string' && !Buffer.isBuffer(input)) input = stringify.stable(input)

  return createHash(hash)
    .update(input, typeof input === 'string' ? 'utf8' : undefined)
    .digest(digest)
}
