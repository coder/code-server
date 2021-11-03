# eslint-import-resolver-alias

[![Version npm][version]](http://browsenpm.org/package/eslint-import-resolver-alias)
![Version node][node]
[![Build Status][build]](https://travis-ci.org/johvin/eslint-import-resolver-alias)
[![Download][download]](https://www.npmjs.com/package/eslint-import-resolver-alias)
[![Dependencies][david]](https://david-dm.org/johvin/eslint-import-resolver-alias)
![peerDependencies][peer]
[![Coverage Status][cover]](https://coveralls.io/github/johvin/eslint-import-resolver-alias?branch=master)
[![Known Vulnerabilities][vulnerabilities]](https://snyk.io/test/npm/eslint-import-resolver-alias)
[![License][license]](https://opensource.org/licenses/MIT)

[version]: http://img.shields.io/npm/v/eslint-import-resolver-alias.svg?style=flat-square
[node]: https://img.shields.io/node/v/eslint-import-resolver-alias/latest.svg?style=flat-square
[build]: http://img.shields.io/travis/johvin/eslint-import-resolver-alias/master.svg?style=flat-square
[download]: https://img.shields.io/npm/dm/eslint-import-resolver-alias.svg?style=flat-square
[david]: https://img.shields.io/david/johvin/eslint-import-resolver-alias.svg?style=flat-square
[peer]: https://img.shields.io/david/peer/johvin/eslint-import-resolver-alias.svg?style=flat-square
[cover]: http://img.shields.io/coveralls/johvin/eslint-import-resolver-alias/master.svg?style=flat-square
[vulnerabilities]: https://snyk.io/test/npm/eslint-import-resolver-alias/badge.svg?style=flat-square
[license]: https://img.shields.io/badge/License-MIT-brightgreen.svg?style=flat-square


This is a simple Node.js module import resolution plugin for [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import), which supports native Node.js module resolution, module alias/mapping and custom file extensions.


## Installation

Prerequisites: Node.js >=4.x and corresponding version of npm.

```shell
npm install eslint-plugin-import eslint-import-resolver-alias --save-dev
```


## Usage

Pass this resolver and its parameters to `eslint-plugin-import` using your `eslint` config file, `.eslintrc` or `.eslintrc.js`.

```js
// .eslintrc.js
module.exports = {
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['babel-polyfill', 'babel-polyfill/dist/polyfill.min.js'],
          ['helper', './utils/helper'],
          ['material-ui/DatePicker', '../custom/DatePicker'],
          ['material-ui', 'material-ui-ie10']
        ],
        extensions: ['.ts', '.js', '.jsx', '.json']
      }
    }
  }
};
```

Note:

- The alias config object contains two properties, `map` and `extensions`, both of which are array types
- The item of `map` array is also array type which contains 2 string
    + The first string represents the alias of module name or path
    + The second string represents the actual module name or path
- The `map` item `['helper', './utils/helper']` means that the modules which match `helper` or `helper/*` will be resolved to `./utils/helper` or `./utils/helper/*` which are located relative to the `process current working directory` (almost the project root directory). If you just want to resolve `helper` to `./utils/helper`, use `['^helper$', './utils/helper']` instead. See [issue #3](https://github.com/johvin/eslint-import-resolver-alias/issues/3)
- The order of 'material-ui/DatePicker' and 'material-ui' cannot be reversed, otherwise the alias rule 'material-ui/DatePicker' does not work
- The default value of `extensions` property is `['.js', '.json', '.node']` if it is assigned to an empty array or not specified

*If the `extensions` property is not specified, the config object can be simplified to the `map` array.*

```js
// .eslintrc.js
module.exports = {
  settings: {
    'import/resolver': {
      alias: [
        ['babel-polyfill', 'babel-polyfill/dist/polyfill.min.js'],
        ['helper', './utils/helper'],
        ['material-ui/DatePicker', '../custom/DatePicker'],
        ['material-ui', 'material-ui-ie10']
      ]
    }
  }
};
```

When the config is not a valid object (such as `true`), the resolver falls back to native Node.js module resolution.

```js
// .eslintrc.js
module.exports = {
  settings: {
    'import/resolver': {
      alias: true
    }
  }
};
```
