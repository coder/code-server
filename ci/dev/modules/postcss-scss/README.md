# PostCSS SCSS Syntax [![Build Status][ci-img]][ci]

<img align="right" width="95" height="95"
     title="Philosopher’s stone, logo of PostCSS"
     src="http://postcss.github.io/postcss/logo.svg">

A [SCSS] parser for [PostCSS].

**This module does not compile SCSS.** It simply parses mixins as custom
at-rules & variables as properties, so that PostCSS plugins can then transform
SCSS source code alongside CSS.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://img.shields.io/travis/postcss/postcss-scss.svg
[SCSS]:    http://sass-lang.com/
[ci]:      https://travis-ci.org/postcss/postcss-scss

<a href="https://evilmartians.com/?utm_source=postcss">
<img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg" alt="Sponsored by Evil Martians" width="236" height="54">
</a>


## Install

```sh
npm --save install postcss-scss
```

or (if you use [Yarn](https://yarnpkg.com/))

```sh
yarn add --dev postcss-scss
```


## Usage

There are two ways to use this parser:

### 1. SCSS Transformations

The main use case of this plugin is to apply PostCSS transformations directly
to SCSS source code.

For example, you can lint SCSS source with [Stylelint]
and linter will automatically fix issues in the source.

```js
// postcss.config.js
module.exports = {
  syntax: 'postcss-scss',
  plugins: {
    …
  }
}
```

[Stylelint]:    http://stylelint.io/


### 2. Inline Comments for PostCSS

Also you can use this parser just to add `//` single-line comment
to your PostCSS project (without any Sass):

```scss
:root {
    // Main theme color
    --color: red;
}
```

Note that you don’t need a special stringifier to handle the output; the default
one will automatically convert single line comments into block comments.

```js
// postcss.config.js
module.exports = {
  parser: 'postcss-scss',
  plugins: {
    …
  }
}
```

If you want Sass behaviour with removing inline comments, you can use
[postcss-strip-inline-comments] plugin.

[postcss-strip-inline-comments]: https://github.com/mummybot/postcss-strip-inline-comments
