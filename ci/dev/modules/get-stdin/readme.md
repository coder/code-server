# get-stdin [![Build Status](https://travis-ci.com/sindresorhus/get-stdin.svg?branch=master)](https://travis-ci.com/sindresorhus/get-stdin)

> Get [stdin](https://nodejs.org/api/process.html#process_process_stdin) as a string or buffer

## Install

```
$ npm install get-stdin
```

## Usage

```js
// example.js
const getStdin = require('get-stdin');

(async () => {
	console.log(await getStdin());
	//=> 'unicorns'
})();
```

```
$ echo unicorns | node example.js
unicorns
```

## API

Both methods returns a promise that is resolved when the `end` event fires on the `stdin` stream, indicating that there is no more data to be read.

### getStdin()

Get `stdin` as a `string`.

In a TTY context, a promise that resolves to an empty `string` is returned.

### getStdin.buffer()

Get `stdin` as a `Buffer`.

In a TTY context, a promise that resolves to an empty `Buffer` is returned.

## Related

- [get-stream](https://github.com/sindresorhus/get-stream) - Get a stream as a string or buffer

---

<div align="center">
	<b>
		<a href="https://tidelift.com/subscription/pkg/npm-get-stdin?utm_source=npm-get-stdin&utm_medium=referral&utm_campaign=readme">Get professional support for this package with a Tidelift subscription</a>
	</b>
	<br>
	<sub>
		Tidelift helps make open source sustainable for maintainers while giving companies<br>assurances about security, maintenance, and licensing for their dependencies.
	</sub>
</div>
