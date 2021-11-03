# PostCSS Safe Parser [![Build Status][ci-img]][ci]

<img align="right" width="95" height="95"
     title="Philosopher’s stone, logo of PostCSS"
     src="http://postcss.github.io/postcss/logo.svg">

A fault-tolerant CSS parser for [PostCSS], which will find & fix syntax errors,
capable of parsing any input. It is useful for:

* Parse legacy code with many hacks. For example, it can parse all examples
  from [Browserhacks].
* Works with demo tools with live input like [Autoprefixer demo].

[Autoprefixer demo]: http://simevidas.jsbin.com/gufoko/quiet
[Browserhacks]:      http://browserhacks.com/
[PostCSS]:           https://github.com/postcss/postcss
[ci-img]:            https://img.shields.io/travis/postcss/postcss-safe-parser.svg
[ci]:                https://travis-ci.org/postcss/postcss-safe-parser

<a href="https://evilmartians.com/?utm_source=postcss">
<img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg" alt="Sponsored by Evil Martians" width="236" height="54">
</a>

## Usage

```js
var safe   = require('postcss-safe-parser');
var badCss = 'a {';

postcss(plugins).process(badCss, { parser: safe }).then(function (result) {
    result.css //= 'a {}'
});
```
