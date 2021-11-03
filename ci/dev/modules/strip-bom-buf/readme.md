# strip-bom-buf [![Build Status](https://travis-ci.org/sindresorhus/strip-bom-buf.svg?branch=master)](https://travis-ci.org/sindresorhus/strip-bom-buf)

> Strip UTF-8 [byte order mark](http://en.wikipedia.org/wiki/Byte_order_mark#UTF-8) (BOM) from a buffer

From Wikipedia:

> The Unicode Standard permits the BOM in UTF-8, but does not require nor recommend its use. Byte order has no meaning in UTF-8.


## Install

```
$ npm install --save strip-bom-buf
```


## Usage

```js
const fs = require('fs');
const stripBomBuf = require('strip-bom-buf');

stripBomBuf(fs.readFileSync('unicorn.txt'));
//=> 'unicorn'
```


## Related

- [strip-bom](https://github.com/sindresorhus/strip-bom) - String version of this module
- [strip-bom-stream](https://github.com/sindresorhus/strip-bom-stream) - Stream version of this module


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
