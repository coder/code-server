# vm2 [![NPM Version][npm-image]][npm-url] [![NPM Downloads][downloads-image]][downloads-url] [![Package Quality][quality-image]][quality-url] [![Travis CI][travis-image]][travis-url] [![Known Vulnerabilities][snyk-image]][snyk-url]

vm2 is a sandbox that can run untrusted code with whitelisted Node's built-in modules. Securely!

**Features**

* Runs untrusted code securely in a single process with your code side by side
* Full control over sandbox's console output
* Sandbox has limited access to process's methods
* Sandbox can require modules (builtin and external)
* You can limit access to certain (or all) builtin modules
* You can securely call methods and exchange data and callbacks between sandboxes
* Is immune to all known methods of attacks
* Transpilers support

**How does it work**

* It uses internal VM module to create secure context
* It uses [Proxies](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to prevent escaping the sandbox
* It overrides builtin require to control access to modules

**What is the difference between Node's vm and vm2?**

Try it yourself:

```javascript
const vm = require('vm');
vm.runInNewContext('this.constructor.constructor("return process")().exit()');
console.log('Never gets executed.');
```

```javascript
const {VM} = require('vm2');
new VM().run('this.constructor.constructor("return process")().exit()');
// Throws ReferenceError: process is not defined
```

## Installation

**IMPORTANT**: Requires Node.js 6 or newer.

    npm install vm2

## Quick Example

```javascript
const {VM} = require('vm2');
const vm = new VM();

vm.run(`process.exit()`); // TypeError: process.exit is not a function
```

```javascript
const {NodeVM} = require('vm2');
const vm = new NodeVM({
    require: {
        external: true
    }
});

vm.run(`
    var request = require('request');
    request('http://www.google.com', function (error, response, body) {
        console.error(error);
        if (!error && response.statusCode == 200) {
            console.log(body) // Show the HTML for the Google homepage.
        }
    })
`, 'vm.js');
```

## Documentation

* [VM](#vm)
* [NodeVM](#nodevm)
* [VMScript](#vmscript)
* [Error handling](#error-handling)
* [Debugging a sandboxed code](#debugging-a-sandboxed-code)
* [Read-only objects](#read-only-objects-experimental)
* [Protected objects](#protected-objects-experimental)
* [Cross-sandbox relationships](#cross-sandbox-relationships)
* [CLI](#cli)
* [2.x to 3.x changes](https://github.com/patriksimek/vm2/wiki/2.x-to-3.x-changes)
* [1.x and 2.x docs](https://github.com/patriksimek/vm2/wiki/1.x-and-2.x-docs)
* [Contributing](https://github.com/patriksimek/vm2/wiki/Contributing)

## VM

VM is a simple sandbox, without `require` feature, to synchronously run an untrusted code. Only JavaScript built-in objects + Buffer are available. Scheduling functions (`setInterval`, `setTimeout` and `setImmediate`) are not available by default.

**Options:**

* `timeout` - Script timeout in milliseconds.
* `sandbox` - VM's global object.
* `compiler` - `javascript` (default) or `coffeescript` or custom compiler function. The library expects you to have coffee-script pre-installed if the compiler is set to `coffeescript`.
* `eval` - If set to `false` any calls to `eval` or function constructors (`Function`, `GeneratorFunction`, etc) will throw an `EvalError` (default: `true`).
* `wasm` -  If set to `false` any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError` (default: `true`).
* `fixAsync` - If set to `true` any attempt to run code using async will throw a `VMError` (default: `false`).

**IMPORTANT**: Timeout is only effective on synchronous code you run through `run`. Timeout is NOT effective on any method returned by VM. There're some situations when timeout doesn't work - see [#244](https://github.com/patriksimek/vm2/pull/244).

```javascript
const {VM} = require('vm2');

const vm = new VM({
    timeout: 1000,
    sandbox: {}
});

vm.run("process.exit()"); // throws ReferenceError: process is not defined
```

You can also retrieve values from VM.

```javascript
let number = vm.run("1337"); // returns 1337
```

**TIP**: See tests for more usage examples.

## NodeVM

Unlike `VM`, `NodeVM` lets you require modules same way like in regular Node's context.

**Options:**

* `console` - `inherit` to enable console, `redirect` to redirect to events, `off` to disable console (default: `inherit`).
* `sandbox` - VM's global object.
* `compiler` - `javascript` (default) or `coffeescript` or custom compiler function (which receives the code, and it's filepath). The library expects you to have coffee-script pre-installed if the compiler is set to `coffeescript`.
* `eval` - If set to `false` any calls to `eval` or function constructors (`Function`, `GeneratorFunction`, etc) will throw an `EvalError` (default: `true`).
* `wasm` -  If set to `false` any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError` (default: `true`).
* `sourceExtensions` - Array of file extensions to treat as source code (default: `['js']`).
* `require` - `true` or object to enable `require` method (default: `false`).
* `require.external` - `true`, an array of allowed external modules or an object (default: `false`).
* `require.external.modules` - Array of allowed external modules. Also supports wildcards, so specifying `['@scope/*-ver-??]`, for instance, will allow using all modules having a name of the form `@scope/something-ver-aa`, `@scope/other-ver-11`, etc.
* `require.external.transitive` - Boolean which indicates if transitive dependencies of external modules are allowed (default: `false`).
* `require.builtin` - Array of allowed builtin modules, accepts ["*"] for all (default: none).
* `require.root` - Restricted path(s) where local modules can be required (default: every path).
* `require.mock` - Collection of mock modules (both external or builtin).
* `require.context` - `host` (default) to require modules in host and proxy them to sandbox. `sandbox` to load, compile and require modules in sandbox. Builtin modules except `events` always required in host and proxied to sandbox.
* `require.import` - Array of modules to be loaded into NodeVM on start.
* `require.resolve` - An additional lookup function in case a module wasn't found in one of the traditional node lookup paths.
* `nesting` - `true` to enable VMs nesting (default: `false`).
* `wrapper` - `commonjs` (default) to wrap script into CommonJS wrapper, `none` to retrieve value returned by the script.
* `argv` - Array to be passed to `process.argv`.
* `env` - Object to be passed to `process.env`.

**IMPORTANT**: Timeout is not effective for NodeVM so it is not immune to `while (true) {}` or similar evil.

**REMEMBER**: The more modules you allow, the more fragile your sandbox becomes.

```javascript
const {NodeVM} = require('vm2');

const vm = new NodeVM({
    console: 'inherit',
    sandbox: {},
    require: {
        external: true,
        builtin: ['fs', 'path'],
        root: "./",
        mock: {
            fs: {
                readFileSync() { return 'Nice try!'; }
            }
        }
    }
});

// Sync

let functionInSandbox = vm.run("module.exports = function(who) { console.log('hello '+ who); }");
functionInSandbox('world');

// Async

let functionWithCallbackInSandbox = vm.run("module.exports = function(who, callback) { callback('hello '+ who); }");
functionWithCallbackInSandbox('world', (greeting) => {
    console.log(greeting);
});
```

When `wrapper` is set to `none`, `NodeVM` behaves more like `VM` for synchronous code.

```javascript
assert.ok(vm.run('return true') === true);
```

**TIP**: See tests for more usage examples.

### Loading modules by relative path

To load modules by relative path, you must pass full path of the script you're running as a second argument of vm's `run` method if the script is a string. Filename then also shows up in any stack traces produced from the script.

```javascript
vm.run("require('foobar')", "/data/myvmscript.js");
```

If the script you are running is an VMScript, the path is given in the VMScript constructor.

```javascript
const script = new VMScript("require('foobar')", {filename: "/data/myvmscript.js"});
vm.run(script);
```

## VMScript

You can increase performance by using pre-compiled scripts. The pre-compiled VMScript can be run later multiple times. It is important to note that the code is not bound to any VM (context); rather, it is bound before each run, just for that run.

```javascript
const {VM, VMScript} = require('vm2');

const vm = new VM();
const script = new VMScript("Math.random()");
console.log(vm.run(script));
console.log(vm.run(script));
```

Works for both `VM` and `NodeVM`.

```javascript
const {NodeVM, VMScript} = require('vm2');

const vm = new NodeVM();
const script = new VMScript("module.exports = Math.random()");
console.log(vm.run(script));
console.log(vm.run(script));
```

Code is compiled automatically first time you run it. You can compile the code anytime with `script.compile()`. Once the code is compiled, the method has no effect.

## Error handling

Errors in code compilation and synchronous code execution can be handled by `try`/`catch`. Errors in asynchronous code execution can be handled by attaching `uncaughtException` event handler to Node's `process`.

```javascript
try {
    var script = new VMScript("Math.random()").compile();
} catch (err) {
    console.error('Failed to compile script.', err);
}

try {
    vm.run(script);
} catch (err) {
    console.error('Failed to execute script.', err);
}

process.on('uncaughtException', (err) => {
    console.error('Asynchronous error caught.', err);
})
```

## Debugging a sandboxed code

You can debug/inspect code running in the sandbox as if it was running in a normal process.

- You can use breakpoints (requires you to specify a script file name)
- You can use `debugger` keyword.
- You can use step-in to step inside the code running in the sandbox.

**Example**

/tmp/main.js:
```javascript
const {VM, VMScript} = require('.');
const fs = require('fs');
const file = `${__dirname}/sandbox.js`;

// By providing a file name as second argument you enable breakpoints
const script = new VMScript(fs.readFileSync(file), file);

new VM().run(script);
```

/tmp/sandbox.js
```javascript
const foo = 'ahoj';

// Debugger keyword works just fine anywhere.
// Even without specifying a file name to the VMScript object.
debugger;
```

## Read-only objects (experimental)

To prevent sandboxed script to add/change/delete properties to/from the proxied objects, you can use `freeze` methods to make the object read-only. This is only effective inside VM. Frozen objects are affected deeply. Primitive types can not be frozen.

**Example without using `freeze`:**

```javascript
const util = {
    add: (a, b) => a + b
}

const vm = new VM({
    sandbox: {util}
});

vm.run('util.add = (a, b) => a - b');
console.log(util.add(1, 1)); // returns 0
```

**Example with using `freeze`:**

```javascript
const vm = new VM(); // Objects specified in sandbox can not be frozen.
vm.freeze(util, 'util'); // Second argument adds object to global.

vm.run('util.add = (a, b) => a - b'); // Fails silently when not in strict mode.
console.log(util.add(1, 1)); // returns 2
```

**IMPORTANT:** It is not possible to freeze objects that has already been proxied to the VM.

## Protected objects (experimental)

Unlike `freeze`, this method allows sandboxed script to add/modify/delete properties on object with one exception - it is not possible to attach functions. Sandboxed script is therefore not able to modify methods like `toJSON`, `toString` or `inspect`.

**IMPORTANT:** It is not possible to protect objects that has already been proxied to the VM.

## Cross-sandbox relationships

```javascript
const assert = require('assert');
const {VM} = require('vm2');

const sandbox = {
    object: new Object(),
    func: new Function(),
    buffer: new Buffer([0x01, 0x05])
}

const vm = new VM({sandbox});

assert.ok(vm.run(`object`) === sandbox.object);
assert.ok(vm.run(`object instanceof Object`));
assert.ok(vm.run(`object`) instanceof Object);
assert.ok(vm.run(`object.__proto__ === Object.prototype`));
assert.ok(vm.run(`object`).__proto__ === Object.prototype);

assert.ok(vm.run(`func`) === sandbox.func);
assert.ok(vm.run(`func instanceof Function`));
assert.ok(vm.run(`func`) instanceof Function);
assert.ok(vm.run(`func.__proto__ === Function.prototype`));
assert.ok(vm.run(`func`).__proto__ === Function.prototype);

assert.ok(vm.run(`new func() instanceof func`));
assert.ok(vm.run(`new func()`) instanceof sandbox.func);
assert.ok(vm.run(`new func().__proto__ === func.prototype`));
assert.ok(vm.run(`new func()`).__proto__ === sandbox.func.prototype);

assert.ok(vm.run(`buffer`) === sandbox.buffer);
assert.ok(vm.run(`buffer instanceof Buffer`));
assert.ok(vm.run(`buffer`) instanceof Buffer);
assert.ok(vm.run(`buffer.__proto__ === Buffer.prototype`));
assert.ok(vm.run(`buffer`).__proto__ === Buffer.prototype);
assert.ok(vm.run(`buffer.slice(0, 1) instanceof Buffer`));
assert.ok(vm.run(`buffer.slice(0, 1)`) instanceof Buffer);
```

## CLI

Before you can use vm2 in command line, install it globally with `npm install vm2 -g`.

```
$ vm2 ./script.js
```

## Known Issues

* It is not possible to define class that extends proxied class.

## Deployment

1. Update the CHANGELOG
2. Update the `package.json` version number
3. Commit the changes
4. Run `npm publish`

## Sponsors

[![Integromat][integromat-image]][integromat-url]

[npm-image]: https://img.shields.io/npm/v/vm2.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/vm2
[downloads-image]: https://img.shields.io/npm/dm/vm2.svg?style=flat-square
[downloads-url]: https://www.npmjs.com/package/vm2
[quality-image]: http://npm.packagequality.com/shield/vm2.svg?style=flat-square
[quality-url]: http://packagequality.com/#?package=vm2
[travis-image]: https://img.shields.io/travis/patriksimek/vm2/master.svg?style=flat-square&label=unit
[travis-url]: https://travis-ci.org/patriksimek/vm2
[snyk-image]: https://snyk.io/test/github/patriksimek/vm2/badge.svg
[snyk-url]: https://snyk.io/test/github/patriksimek/vm2
[integromat-image]: https://static.integromat.com/logo/45_text.png
[integromat-url]: https://www.integromat.com
