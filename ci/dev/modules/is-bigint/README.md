# is-bigint <sup>[![Version Badge][2]][1]</sup>

[![Build Status][3]][4]
[![dependency status][5]][6]
[![dev dependency status][7]][8]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][11]][1]

Is this an ES BigInt value?

## Example

```js
var isBigInt = require('is-bigint');
assert(!isBigInt(function () {}));
assert(!isBigInt(null));
assert(!isBigInt(function* () { yield 42; return Infinity; });
assert(!isBigInt(Symbol('foo')));

assert(isBigInt(1n));
assert(isBigInt(Object(1n)));
```

## Tests
Simply clone the repo, `npm install`, and run `npm test`

[1]: https://npmjs.org/package/is-bigint
[2]: http://versionbadg.es/ljharb/is-bigint.svg
[3]: https://travis-ci.org/ljharb/is-bigint.svg
[4]: https://travis-ci.org/ljharb/is-bigint
[5]: https://david-dm.org/ljharb/is-bigint.svg
[6]: https://david-dm.org/ljharb/is-bigint
[7]: https://david-dm.org/ljharb/is-bigint/dev-status.svg
[8]: https://david-dm.org/ljharb/is-bigint#info=devDependencies
[11]: https://nodei.co/npm/is-bigint.png?downloads=true&stars=true
[license-image]: http://img.shields.io/npm/l/is-bigint.svg
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/is-bigint.svg
[downloads-url]: http://npm-stat.com/charts.html?package=is-bigint
