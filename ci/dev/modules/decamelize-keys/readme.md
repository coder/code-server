# decamelize-keys [![Build Status](https://travis-ci.org/dsblv/decamelize-keys.svg?branch=master)](https://travis-ci.org/dsblv/decamelize-keys)

> Convert object keys from camelCase to lowercase with a custom separator using [`decamelize`](https://github.com/sindresorhus/decamelize)

*This project was forked from [`camelcase-keys`](https://github.com/sindresorhus/camelcase-keys) and converted to do the opposite*


## Install

```sh
$ npm install --save decamelize-keys
```


## Usage

```js
const decamelizeKeys = require('decamelize-keys');

decamelizeKeys({fooBar: true}, '-');
//=> {'foo-bar': true}
```


## API

### decamelizeKeys(input, [separator], [options])

### input

Type: `object`  
*Required*

Object to decamelize.

### separator

Type: `string`  
Default: `_`

A string to insert between words.

### options

Type: `object`

#### separator

Type: `string`  
Default: `_`

Alternative way to specify [separator](#separator).

#### exclude

Type: `array`  
Default: `[]`

Exclude keys from being decamelized.


## Related

See [`camelcase-keys`](https://github.com/sindresorhus/camelcase-keys) for the inverse.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com), [Dmirty Sobolev](https://github.com/dsblv)
