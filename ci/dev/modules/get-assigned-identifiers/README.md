# get-assigned-identifiers

get a list of identifiers that are initialised by a JavaScript AST node.

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/get-assigned-identifiers.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/get-assigned-identifiers
[travis-image]: https://img.shields.io/travis/goto-bus-stop/get-assigned-identifiers.svg?style=flat-square
[travis-url]: https://travis-ci.org/goto-bus-stop/get-assigned-identifiers
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

## Install

```
npm install get-assigned-identifiers
```

## Usage

```js
var getAssignedIdentifiers = require('get-assigned-identifiers')

var ast = parse(`
  var { a, b: [ c,, ...x ], d } = whatever()
`)
var node = ast.body[0].declarations[0].id
getAssignedIdentifiers(node)
// → [{ name: 'a' }, { name: 'c' }, { name: 'x' }, { name: 'd' }]
```

## API

### `getAssignedIdentifiers(node)`

Return an array of AST Nodes referencing identifiers that are initialised by the `node`, taking into account destructuring.

If `node` is not an identifier or destructuring node, this returns an empty array.

## License

[Apache-2.0](LICENSE.md)
