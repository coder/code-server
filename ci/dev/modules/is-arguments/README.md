#is-arguments <sup>[![Version Badge][2]][1]</sup>

[![dependency status][5]][6]
[![dev dependency status][7]][8]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][11]][1]

Is this an arguments object? It's a harder question than you think.

## Example

```js
var isArguments = require('is-arguments');
var assert = require('assert');

assert.equal(isArguments({}), false);
assert.equal(isArguments([]), false);
(function () {
	assert.equal(isArguments(arguments), true);
}())
```

## Caveats
If you have modified an actual `arguments` object by giving it a `Symbol.toStringTag` property, then this package will return `false`.

## Tests
Simply clone the repo, `npm install`, and run `npm test`

[1]: https://npmjs.org/package/is-arguments
[2]: http://versionbadg.es/inspect-js/is-arguments.svg
[5]: https://david-dm.org/inspect-js/is-arguments.svg
[6]: https://david-dm.org/inspect-js/is-arguments
[7]: https://david-dm.org/inspect-js/is-arguments/dev-status.svg
[8]: https://david-dm.org/inspect-js/is-arguments#info=devDependencies
[11]: https://nodei.co/npm/is-arguments.png?downloads=true&stars=true
[license-image]: http://img.shields.io/npm/l/is-arguments.svg
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/is-arguments.svg
[downloads-url]: http://npm-stat.com/charts.html?package=is-arguments

