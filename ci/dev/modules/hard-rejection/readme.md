# hard-rejection [![Build Status](https://travis-ci.org/sindresorhus/hard-rejection.svg?branch=master)](https://travis-ci.org/sindresorhus/hard-rejection)

> Make unhandled promise rejections fail hard right away instead of the default [silent fail](https://gist.github.com/benjamingr/0237932cee84712951a2)

Promises fail silently if you don't attach a `.catch()` handler.

This module exits the process with an error message right away when an unhandled rejection is encountered.<br>
**Note: That might not be desirable as unhandled rejections can be [handled at a future point in time](https://nodejs.org/api/process.html#process_event_unhandledrejection), although not common. You've been warned.**

Intended for top-level long-running processes like servers, **but not in reusable modules.**<br>
For command-line apps and tests, see [`loud-rejection`](https://github.com/sindresorhus/loud-rejection).


## Install

```
$ npm install hard-rejection
```


## Usage

```js
const hardRejection = require('hard-rejection');
const promiseFunction = require('some-promise-fn');

// Install the handler
hardRejection();

promiseFunction();
```

Without this module it's more verbose and you might even miss some that will fail silently:

```js
const promiseFunction = require('some-promise-fn');

function error(error) {
	console.error(error.stack);
	process.exit(1);
}

promiseFunction().catch(error);
```

### Register script

Alternatively to the above, you may simply require `hard-rejection/register` and the handler will be automagically installed for you.

This is handy for ES2015 imports:

```js
import 'hard-rejection/register';
```


## API

### hardRejection([log])

#### log

Type: `Function`<br>
Default: `console.error`

Custom logging function to print the rejected promise. Receives the error stack.


## Related

- [loud-rejection](https://github.com/sindresorhus/loud-rejection) - Make unhandled promise rejections fail loudly instead of the default silent fail
- [More…](https://github.com/sindresorhus/promise-fun)


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
