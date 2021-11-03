# dash-ast

walk an AST, quickly

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/dash-ast.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/dash-ast
[travis-image]: https://img.shields.io/travis/goto-bus-stop/dash-ast.svg?style=flat-square
[travis-url]: https://travis-ci.org/goto-bus-stop/dash-ast
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

## Install

```
npm install dash-ast
```

## Usage

```js
var dashAst = require('dash-ast')
var isIdentifier = require('estree-is-identifier')

var deps = []
dashAst(ast, function (node, parent) {
  if (node.type === 'CallExpression' && isIdentifier(node.callee, 'require')) {
    deps.push(node.arguments[0])
  }
})
```

## API

### `dashAst(ast, callback)`

Call `callback(node, parent)` on each node in `ast`. This does a preorder traversal, i.e. `callback` receives child nodes _after_ the parent node.

### `dashAst(ast, { enter, leave })`

Call `enter(node, parent)` on each node in `ast` before traversing its children, and call `leave(enter, parent)` on each node _after_ traversing its children. If a node does not have children, `enter()` and `leave()` are called immediately after each other.

### `dashAst.withParent(ast, callback)`

Call `callback(node)` on each node in `ast`. This does a preorder traversal, i.e. `callback` receives child nodes _after_ the parent node.
Each `node` has an additional property `node.parent` referring to the parent node.

### `dashAst.withParent(ast, { enter, leave })`

Call `enter(node, parent)` on each node in `ast` before traversing its children, and call `leave(enter, parent)` on each node _after_ traversing its children. If a node does not have children, `enter()` and `leave()` are called immediately after each other.
Each `node` has an additional property `node.parent` referring to the parent node.

## License

[Apache-2.0](LICENSE.md)
