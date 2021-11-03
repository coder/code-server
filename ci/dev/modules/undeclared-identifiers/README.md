# undeclared-identifiers

find undeclared identifiers and property accesses in a javascript file.

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/undeclared-identifiers.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/undeclared-identifiers
[travis-image]: https://img.shields.io/travis/goto-bus-stop/undeclared-identifiers.svg?style=flat-square
[travis-url]: https://travis-ci.org/goto-bus-stop/undeclared-identifiers
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

## Install

```
npm install undeclared-identifiers
```

## Usage

```js
var undeclaredIdentifiers = require('undeclared-identifiers')

undeclaredIdentifiers(src)
// { identifiers: ['Buffer'],
//   properties: ['Buffer.isBuffer'] }
```

## API

### `res = undeclaredIdentifiers(source, opts)`

Find undeclared identifiers and properties that are used in the `source`. `source` can be an AST or a source string that will be parsed using [acorn-node](https://github.com/browserify/acorn-node).

`res` is an object with properties:

  - `res.identifiers` - an array of variable names as strings.
  - `res.properties` - an array of property names as .-separated strings, such as `'xyz.abc'`. These are the property accesses on the undeclared variables found in `res.identifiers`.

Set `opts.properties` to false to only return identifiers.

When `opts.wildcard` is true, unknown uses of undeclared identifiers will be added to `res.properties` as `'VarName.*'`.

```js
undeclaredIdentifiers('Buffer(), Buffer.from()', { wildcard: true })
// { identifiers: ['Buffer'],
//   properties: ['Buffer.*', 'Buffer.from'] }
```

## License

[Apache-2.0](LICENSE.md)
