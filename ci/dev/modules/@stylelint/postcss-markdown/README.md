# PostCSS Markdown Syntax

[![NPM version](https://img.shields.io/npm/v/@stylelint/postcss-markdown.svg)](https://www.npmjs.org/package/@stylelint/postcss-markdown) [![Build Status](https://github.com/stylelint/postcss-markdown/workflows/CI/badge.svg)](https://github.com/stylelint/postcss-markdown/actions)

<img align="right" width="95" height="95"
	title="Philosopher’s stone, logo of PostCSS"
	src="http://postcss.github.io/postcss/logo.svg">

[PostCSS](https://github.com/postcss/postcss) Syntax for parsing [Markdown](https://daringfireball.net/projects/markdown/syntax)

## Getting Started

First thing's first, install the module:

```
npm install postcss-syntax postcss-markdown --save-dev
```

If you want support SCSS/SASS/LESS/SugarSS syntax, you need to install the corresponding module.

- SCSS: [postcss-scss](https://github.com/postcss/postcss-scss)
- SASS: [postcss-sass](https://github.com/aleshaoleg/postcss-sass)
- LESS: [postcss-less](https://github.com/shellscape/postcss-less)
- SugarSS: [sugarss](https://github.com/postcss/sugarss)

## Use Cases

```js
var syntax = require("postcss-syntax")({
  // Enable support for HTML (default: true) See: https://github.com/gucong3000/postcss-html
  htmlInMd: true,
  // syntax for parse scss (non-required options)
  scss: require("postcss-scss"),
  // syntax for parse less (non-required options)
  less: require("postcss-less"),
  // syntax for parse css blocks (non-required options)
  css: require("postcss-safe-parser")
});
var autoprefixer = require("autoprefixer");
postcss([autoprefixer])
  .process(source, { syntax: syntax })
  .then(function(result) {
    // An alias for the result.css property. Use it with syntaxes that generate non-CSS output.
    result.content;
  });
```

input:

<pre><code># title

```css
::placeholder {
	color: gray;
}
```
</code></pre>

output:

<pre><code># title

```css
::-webkit-input-placeholder {
	color: gray;
}
:-ms-input-placeholder {
	color: gray;
}
::-ms-input-placeholder {
	color: gray;
}
::placeholder {
	color: gray;
}
```
</code></pre>

If you want support SCSS/SASS/LESS/SugarSS syntax, you need to install these module:

- SCSS: [postcss-scss](https://github.com/postcss/postcss-scss)
- SASS: [postcss-sass](https://github.com/aleshaoleg/postcss-sass)
- LESS: [postcss-less](https://github.com/shellscape/postcss-less)
- SugarSS: [sugarss](https://github.com/postcss/sugarss)

## Advanced Use Cases

See: [postcss-syntax](https://github.com/gucong3000/postcss-syntax)

## Style Transformations

The main use case of this plugin is apply PostCSS transformations to CSS (and CSS-like) code blocks in markdown file.
