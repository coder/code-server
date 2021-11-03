PostCSS Syntax
====

[![NPM version](https://img.shields.io/npm/v/postcss-syntax.svg?style=flat-square)](https://www.npmjs.com/package/postcss-syntax)
[![Travis](https://img.shields.io/travis/gucong3000/postcss-syntax.svg)](https://travis-ci.org/gucong3000/postcss-syntax)
[![Travis](https://img.shields.io/travis/gucong3000/postcss-syntaxes.svg?label=integration)](https://travis-ci.org/gucong3000/postcss-syntaxes)
[![Codecov](https://img.shields.io/codecov/c/github/gucong3000/postcss-syntax.svg)](https://codecov.io/gh/gucong3000/postcss-syntax)
[![David](https://img.shields.io/david/dev/gucong3000/postcss-syntax.svg)](https://david-dm.org/gucong3000/postcss-syntax?type=dev)

<img align="right" width="95" height="95"
	title="Philosopher’s stone, logo of PostCSS"
	src="http://postcss.github.io/postcss/logo.svg">

postcss-syntax can automatically switch the required [PostCSS](https://github.com/postcss/postcss) syntax by file extension/source

## Getting Started

First thing's first, install the module:

```
npm install postcss-syntax --save-dev
```

If you want support SCSS/SASS/LESS/SugarSS syntax, you need to install these module:

- SCSS: [postcss-scss](https://github.com/postcss/postcss-scss)
- SASS: [postcss-sass](https://github.com/aleshaoleg/postcss-sass)
- LESS: [postcss-less](https://github.com/shellscape/postcss-less)
- SugarSS: [sugarss](https://github.com/postcss/sugarss)

If you want support HTML (and HTML-like)/Markdown/CSS-in-JS file format, you need to install these module:

- CSS-in-JS: [postcss-jsx](https://github.com/gucong3000/postcss-jsx)
- HTML (and HTML-like): [postcss-html](https://github.com/gucong3000/postcss-html)
- Markdown: [postcss-markdown](https://github.com/gucong3000/postcss-markdown)

## Use Cases

```js
const postcss = require('postcss');
const syntax = require('postcss-syntax')({
	rules: [
		{
			test: /\.(?:[sx]?html?|[sx]ht|vue|ux|php)$/i,
			extract: 'html',
		},
		{
			test: /\.(?:markdown|md)$/i,
			extract: 'markdown',
		},
		{
			test: /\.(?:m?[jt]sx?|es\d*|pac)$/i,
			extract: 'jsx',
		},
		{
			// custom language for file extension
			test: /\.postcss$/i,
			lang: 'scss'
		},
		{
			// custom language for file extension
			test: /\.customcss$/i,
			lang: 'custom'
		},
	],

	// custom parser for CSS (using `postcss-safe-parser`)
	css: 'postcss-safe-parser',
	// custom parser for SASS (PostCSS-compatible syntax.)
	sass: require('postcss-sass'),
	// custom parser for SCSS (by module name)
	scss: 'postcss-scss',
	// custom parser for LESS (by module path)
	less: './node_modules/postcss-less',
	// custom parser for SugarSS
	sugarss: require('sugarss'),
	// custom parser for custom language
	custom: require('postcss-custom-syntax'),

});
postcss(plugins).process(source, { syntax: syntax }).then(function (result) {
	// An alias for the result.css property. Use it with syntaxes that generate non-CSS output.
	result.content
});
```
