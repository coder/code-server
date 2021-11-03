# vinyl-file [![Build Status](https://travis-ci.org/sindresorhus/vinyl-file.svg?branch=master)](https://travis-ci.org/sindresorhus/vinyl-file)

> Create a [Vinyl file](https://github.com/gulpjs/vinyl) from an actual file


## Install

```
$ npm install --save vinyl-file
```


## Usage

```js
const vinylFile = require('vinyl-file');

vinylFile.read('index.js').then(file => {
	console.log(file.path);
	//=> '/Users/sindresorhus/dev/vinyl-file/index.js'

	console.log(file.cwd);
	//=> '/Users/sindresorhus/dev/vinyl-file'
});

const file = vinylFile.readSync('index.js');

console.log(file.path);
//=> '/Users/sindresorhus/dev/vinyl-file/index.js'

console.log(file.cwd);
//=> '/Users/sindresorhus/dev/vinyl-file'
```


## API

### read(path, [options])

Returns a promise for a Vinyl file.

### readSync(path, [options])

Create a Vinyl file synchronously and return it.

#### options

Type: `Object`

##### base

Type: `string`<br>
Default: `process.cwd()`

Override the `base` of the Vinyl file.

##### cwd

Type: `string`<br>
Default: `process.cwd()`

Override the `cwd` (current working directory) of the Vinyl file.

##### buffer

Type: `boolean`<br>
Default: `true`

Setting this to `false` will return `file.contents` as a stream. This is useful when working with large files. **Note:** Plugins might not implement support for streams.

##### read

Type: `boolean`<br>
Default: `true`

Setting this to `false` will return `file.contents` as `null` and not read the file at all.


## Related

- [vinyl-read](https://github.com/SamVerschueren/vinyl-read) - Create vinyl files from glob patterns


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
