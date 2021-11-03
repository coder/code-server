# unbox-primitive <sup>[![Version Badge][2]][1]</sup>

[![dependency status][5]][6]
[![dev dependency status][7]][8]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][11]][1]

Unbox a boxed JS primitive value. This module works cross-realm/iframe, does not depend on `instanceof` or mutable properties, and works despite ES6 Symbol.toStringTag.

## Example

```js
var unboxPrimitive = require('unbox-primitive');
var assert = require('assert');

assert.equal(unboxPrimitive(new Boolean(false)), false);
assert.equal(unboxPrimitive(new String('f')), 'f');
assert.equal(unboxPrimitive(new Number(42)), 42);
const s = Symbol();
assert.equal(unboxPrimitive(Object(s)), s);
assert.equal(unboxPrimitive(new BigInt(42)), 42n);

// any primitive, or non-boxed-primitive object, will throw
```

## Tests
Simply clone the repo, `npm install`, and run `npm test`

[1]: https://npmjs.org/package/unbox-primitive
[2]: https://versionbadg.es/ljharb/unbox-primitive.svg
[5]: https://david-dm.org/ljharb/unbox-primitive.svg
[6]: https://david-dm.org/ljharb/unbox-primitive
[7]: https://david-dm.org/ljharb/unbox-primitive/dev-status.svg
[8]: https://david-dm.org/ljharb/unbox-primitive#info=devDependencies
[11]: https://nodei.co/npm/unbox-primitive.png?downloads=true&stars=true
[license-image]: https://img.shields.io/npm/l/unbox-primitive.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/unbox-primitive.svg
[downloads-url]: https://npm-stat.com/charts.html?package=unbox-primitive
