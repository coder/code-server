# pkg-up [![Build Status](https://travis-ci.org/sindresorhus/pkg-up.svg?branch=master)](https://travis-ci.org/sindresorhus/pkg-up)

> Find the closest package.json file


## Install

```
$ npm install --save pkg-up
```


## Usage

```
/
└── Users
    └── sindresorhus
        └── foo
            ├── package.json
            └── bar
                ├── baz
                └── example.js
```

```js
// example.js
const pkgUp = require('pkg-up');

pkgUp().then(filepath => {
	console.log(filepath);
	//=> '/Users/sindresorhus/foo/package.json'
});
```


## API

### pkgUp([cwd])

Returns a `Promise` for either the filepath or `null` if it could be found.

### pkgUp.sync([cwd])

Returns the filepath or `null`.

#### cwd

Type: `string`
Default: `process.cwd()`

Directory to start from.


## Related

- [read-pkg-up](https://github.com/sindresorhus/read-pkg-up) - Read the closest package.json file
- [pkg-dir](https://github.com/sindresorhus/pkg-dir) - Find the root directory of an npm package
- [find-up](https://github.com/sindresorhus/find-up) - Find a file by walking up parent directories


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
