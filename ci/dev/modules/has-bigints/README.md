# has-bigints <sup>[![Version Badge][2]][1]</sup>

[![dependency status][5]][6]
[![dev dependency status][7]][8]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][11]][1]

Determine if the JS environment has BigInt support.

## Example

```js
var hasBigInts = require('has-bigints');

hasBigInts() === true; // if the environment has native BigInt support. Not polyfillable, not forgeable.
```

## Tests
Simply clone the repo, `npm install`, and run `npm test`

[1]: https://npmjs.org/package/has-bigints
[2]: https://versionbadg.es/ljharb/has-bigints.svg
[5]: https://david-dm.org/ljharb/has-bigints.svg
[6]: https://david-dm.org/ljharb/has-bigints
[7]: https://david-dm.org/ljharb/has-bigints/dev-status.svg
[8]: https://david-dm.org/ljharb/has-bigints#info=devDependencies
[9]: https://ci.testling.com/ljharb/has-bigints.png
[10]: https://ci.testling.com/ljharb/has-bigints
[11]: https://nodei.co/npm/has-bigints.png?downloads=true&stars=true
[license-image]: https://img.shields.io/npm/l/has-bigints.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/has-bigints.svg
[downloads-url]: https://npm-stat.com/charts.html?package=has-bigints
