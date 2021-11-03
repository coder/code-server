# acorn-node change log

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/).

## 1.7.2
* Fix a regression introduced in 1.6.3. This reverts the Windows path quoting fix. ([144e1c2](https://github.com/substack/node-shell-quote/commit/144e1c20cd57549a414c827fb3032e60b7b8721c))

## 1.7.1
* Fix `$` being removed when not part of an environment variable name. ([@Adman](https://github.com/Admin) in [#32](https://github.com/substack/node-shell-quote/pull/32))

## 1.7.0
* Add support for parsing `>>` and `>&` redirection operators. ([@forivall](https://github.com/forivall) in [#16](https://github.com/substack/node-shell-quote/pull/16))
* Add support for parsing `<(` process substitution operator. ([@cuonglm](https://github.com/cuonglm) in [#15](https://github.com/substack/node-shell-quote/pull/15))

## 1.6.3
* Fix Windows path quoting problems. ([@dy](https://github.com/dy) in [#34](https://github.com/substack/node-shell-quote/pull/34))

## 1.6.2
* Remove dependencies in favour of native methods. ([@zertosh](https://github.com/zertosh) in [#21](https://github.com/substack/node-shell-quote/pull/21))
