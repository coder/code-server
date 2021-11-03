# module-deps Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 6.2.3 - 2020-08-03
* Improve error message when dependencies cannot be found [#123](https://github.com/browserify/module-deps/pull/123)
* Upgrade `browser-resolve` to 2.0 [#164](https://github.com/browserify/module-deps/pull/164)

## 6.2.2 - 2019-12-13
* Update minimum required version of `detective` [#161](https://github.com/browserify/module-deps/pull/161)

## 6.2.1 - 2019-05-24
* Update minimum required version of `cached-path-relative` [#155](https://github.com/browserify/module-deps/pull/155)
* Add CI testing on Windows [#152](https://github.com/browserify/module-deps/pull/152)
* Add CI testing on recent Node.js versions (10, 11, 12) [#157](https://github.com/browserify/module-deps/pull/157)

## 6.2.0 - 2018-11-13
* Add `.dirname` property to the object given to `opts.resolve` [#154](https://github.com/browserify/module-deps/pull/154)

## 6.1.0 - 2018-05-16
* Add a `detect` option for custom dependency detection [#63](https://github.com/browserify/module-deps/pull/63), [2dcc339](https://github.com/browserify/module-deps/commit/2dcc3399ee67ba51ed26d9a0605a8ccdc70c9db7)

## 6.0.2 - 2018-03-28
* Fix missing 'file' event when file has a syntax error [#146](https://github.com/browserify/module-deps/pull/146)

## 6.0.1 - 2018-03-27
* Fix crash when file has a transform and a syntax error [#145](https://github.com/browserify/module-deps/pull/145)

## 6.0.0 - 2018-02-07
* Ignore package.json files that do not contain JSON objects [#142](https://github.com/browserify/module-deps/pull/142)
* Don't preserve symlinks when resolving transforms, matching Node resolution behaviour [#133](https://github.com/browserify/module-deps/pull/133)
* Fix 'file' events with `persistentCache` [#127](https://github.com/browserify/module-deps/pull/127)
* Add dependencies to a file when transforms emit 'dep' event [#141](https://github.com/browserify/module-deps/pull/141)

## 5.0.1 - 2018-01-06
* Restore support for node < 4.0.0.

## 5.0.0 - 2018-01-02
* Update deps
* Drop support for node < 0.12 due due to detective dropping support
* Add engines field set to `>=4.0.0`
