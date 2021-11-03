PostCSS HTML Syntax
====

[![NPM version](https://img.shields.io/npm/v/postcss-html.svg?style=flat-square)](https://www.npmjs.com/package/postcss-html)
[![Travis](https://img.shields.io/travis/gucong3000/postcss-html.svg)](https://travis-ci.org/gucong3000/postcss-html)
[![Travis](https://img.shields.io/travis/gucong3000/postcss-syntaxes.svg?label=integration)](https://travis-ci.org/gucong3000/postcss-syntaxes)
[![Codecov](https://img.shields.io/codecov/c/github/gucong3000/postcss-html.svg)](https://codecov.io/gh/gucong3000/postcss-html)
[![David](https://img.shields.io/david/gucong3000/postcss-html.svg)](https://david-dm.org/gucong3000/postcss-html)

<img align="right" width="95" height="95"
	title="Philosopher’s stone, logo of PostCSS"
	src="http://postcss.github.io/postcss/logo.svg">

[PostCSS](https://github.com/postcss/postcss) syntax for parsing HTML (and HTML-like)
- [PHP](http://php.net)
- [Vue Single-File Component](https://vue-loader.vuejs.org/spec.html)
- [Quick App](https://doc.quickapp.cn/framework/source-file.html)
- [XSLT](https://www.w3.org/TR/xslt-30/)

## Getting Started

First thing's first, install the module:

```
npm install postcss-syntax postcss-html --save-dev
```

If you want support SCSS/SASS/LESS/SugarSS syntax, you need to install the corresponding module.

- SCSS: [postcss-scss](https://github.com/postcss/postcss-scss)
- SASS: [postcss-sass](https://github.com/aleshaoleg/postcss-sass)
- LESS: [postcss-less](https://github.com/shellscape/postcss-less)
- SugarSS: [sugarss](https://github.com/postcss/sugarss)

## Use Cases

```js
const postcss = require('postcss');
const syntax = require('postcss-html')({
	// syntax for parse scss (non-required options)
	scss: require('postcss-scss'),
	// syntax for parse less (non-required options)
	less: require('postcss-less'),
	// syntax for parse css blocks (non-required options)
	css: require('postcss-safe-parser'),
});
postcss(plugins).process(source, { syntax: syntax }).then(function (result) {
	// An alias for the result.css property. Use it with syntaxes that generate non-CSS output.
	result.content
});
```

If you want support SCSS/SASS/LESS/SugarSS syntax, you need to install these module:

- SCSS: [postcss-scss](https://github.com/postcss/postcss-scss)
- SASS: [postcss-sass](https://github.com/aleshaoleg/postcss-sass)
- LESS: [postcss-less](https://github.com/shellscape/postcss-less)
- SugarSS: [sugarss](https://github.com/postcss/sugarss)

## Advanced Use Cases

See: [postcss-syntax](https://github.com/gucong3000/postcss-syntax)

## Turning PostCSS off from within your HTML

PostCSS can be temporarily turned off by using special comments in your HTML. For example:

```html
<html>
<body>
<!-- postcss-disable -->
<a style="color: red;"></a>
<!-- postcss-enable -->
```

## Style Transformations

The main use case of this plugin is to apply PostCSS transformations to `<style>` tags and `<div style="*">` property in HTML (and HTML-like).
