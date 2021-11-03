# shasum-object

get the shasum of a buffer or object

[Install](#install) - [Usage](#usage) - [License: Apache-2.0](#license)

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/shasum-object.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/shasum-object
[travis-image]: https://img.shields.io/travis/com/goto-bus-stop/shasum-object.svg?style=flat-square
[travis-url]: https://travis-ci.com/goto-bus-stop/shasum-object
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

## Install

```
npm install shasum-object
```

## Usage

```js
var fs = require('fs')
var shasum = require('shasum-object')

shasum('of a string')
shasum(fs.readFileSync('of-a-file.txt'))

shasum({
  of: ['an', 'object']
})
```

## API
### `shasum(input, algorithm = 'sha1', encoding = 'hex')`

Compute the hash for the given input.
- `input` - a string, buffer or JSON object. objects are stringified using [`fast-safe-stringify`](https://github.com/davidmarkclements/fast-safe-stringify).
- `algorithm` - the hash algorithm to use. see [`crypto.createHash`](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options).
- `encoding` - how to encode the hash result. see [`hash.digest`](https://nodejs.org/api/crypto.html#crypto_hash_digest_encoding).

## License

[Apache-2.0](LICENSE.md)
