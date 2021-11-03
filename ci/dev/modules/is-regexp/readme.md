# is-regexp [![Build Status](https://travis-ci.org/sindresorhus/is-regexp.svg?branch=master)](https://travis-ci.org/sindresorhus/is-regexp)

> Check if a value is a regular expression


## Install

```
$ npm install is-regexp
```


## Usage

```js
const isRegexp = require('is-regexp');

isRegexp('unicorn');
//=> false

isRegexp(/unicorn/);
//=> true

isRegexp(new RegExp('unicorn'));
//=> true
```


## Related

- [is](https://github.com/sindresorhus/is) - Type check values


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
