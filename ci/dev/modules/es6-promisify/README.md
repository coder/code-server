[![Travis CI](https://travis-ci.org/digitaldesignlabs/es6-promisify.svg)](https://travis-ci.org/digitaldesignlabs/es6-promisify)

# es6-promisify

Converts callback-based functions to ES6/ES2015 Promises, using a boilerplate callback function.

## Install

Install with [npm](https://npmjs.org/package/es6-promisify)

```bash
npm install es6-promisify
```

## Example

```js
const {promisify} = require("es6-promisify");

// Convert the stat function
const fs = require("fs");
const stat = promisify(fs.stat);

// Now usable as a promise!
try {
    const stats = await stat("example.txt");
    console.log("Got stats", stats);
} catch (err) {
    console.error("Yikes!", err);
}
```

## Promisify methods

```js
const {promisify} = require("es6-promisify");

// Create a promise-based version of send_command
const redis = require("redis").createClient(6379, "localhost");
const client = promisify(redis.send_command.bind(redis));

// Send commands to redis and get a promise back
try {
    const pong = await client.ping();
    console.log("Got", pong);
} catch (err) {
    console.error("Unexpected error", err);
} finally {
    redis.quit();
}
```

## Handle multiple callback arguments, with named parameters

```js
const {promisify} = require("es6-promisify");

function test(cb) {
    return cb(undefined, 1, 2, 3);
}

// Create promise-based version of test
test[promisify.argumentNames] = ["one", "two", "three"];
const multi = promisify(test);

// Returns named arguments
const result = await multi();
console.log(result); // {one: 1, two: 2, three: 3}
```

## Provide your own Promise implementation

```js
const {promisify} = require("es6-promisify");

// Now uses Bluebird
promisify.Promise = require("bluebird");

const test = promisify(cb => cb(undefined, "test"));
const result = await test();
console.log(result); // "test", resolved using Bluebird
```

### Tests

Test with tape

```bash
$ npm test
```

### Changes from v5.0.0

-   Allow developer to specify a different implementations of `Promise`
-   No longer ships with a polyfill for `Promise`. If your environment has no native `Promise` you must polyfill yourself, or set `promisify.Promise` to an A+ compatible `Promise` implementation.
-   Removed support for `settings.thisArg`: use `.bind()` instead.
-   Removed support for `settings.multiArgs`: use named arguments instead.

Published under the [MIT License](http://opensource.org/licenses/MIT).
