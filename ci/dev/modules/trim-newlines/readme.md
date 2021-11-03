# trim-newlines [![Build Status](https://travis-ci.org/sindresorhus/trim-newlines.svg?branch=master)](https://travis-ci.org/sindresorhus/trim-newlines)

> Trim [newlines](https://en.wikipedia.org/wiki/Newline) from the start and/or end of a string


## Install

```
$ npm install trim-newlines
```


## Usage

```js
const trimNewlines = require('trim-newlines');

trimNewlines('\n🦄\r\n');
//=> '🦄'

trimNewlines.start('\n🦄\r\n');
//=> '🦄\r\n'

trimNewlines.end('\n🦄\r\n');
//=> '\n🦄'
```


## API

### trimNewlines(string)

Trim from the start and end of a string.

### trimNewlines.start(string)

Trim from the start of a string.

### trimNewlines.end(string)

Trim from the end of a string.


## Related

- [trim-left](https://github.com/sindresorhus/trim-left) - Similar to `String#trim()` but removes only whitespace on the left
- [trim-right](https://github.com/sindresorhus/trim-right) - Similar to `String#trim()` but removes only whitespace on the right.


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
