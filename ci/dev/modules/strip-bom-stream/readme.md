# strip-bom-stream [![Build Status](https://travis-ci.org/sindresorhus/strip-bom-stream.svg?branch=master)](https://travis-ci.org/sindresorhus/strip-bom-stream)

> Strip UTF-8 [byte order mark](http://en.wikipedia.org/wiki/Byte_order_mark#UTF-8) (BOM) from a stream

From Wikipedia:

> The Unicode Standard permits the BOM in UTF-8, but does not require nor recommend its use. Byte order has no meaning in UTF-8.


## Install

```
$ npm install --save strip-bom-stream
```


## Usage

```js
var fs = require('fs');
var stripBomStream = require('strip-bom-stream');

fs.createReadStream('unicorn.txt')
	.pipe(stripBomStream())
	.pipe(fs.createWriteStream('unicorn.txt'));
```

It's a [Transform stream](http://nodejs.org/api/stream.html#stream_class_stream_transform).


## Related

- [strip-bom](https://github.com/sindresorhus/strip-bom) - Strip UTF-8 byte order mark (BOM) from a string/buffer
- [strip-bom-cli](https://github.com/sindresorhus/strip-bom-cli) - CLI for this module


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
