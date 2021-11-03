# postcss-sass

[![Build Status](https://travis-ci.org/AleshaOleg/postcss-sass.svg?branch=master)](https://travis-ci.org/AleshaOleg/postcss-sass) [![Coverage Status](https://coveralls.io/repos/github/AleshaOleg/postcss-sass/badge.svg)](https://coveralls.io/github/AleshaOleg/postcss-sass) [![Greenkeeper badge](https://badges.greenkeeper.io/AleshaOleg/postcss-sass.svg)](https://greenkeeper.io/) [![Cult Of Martians](http://cultofmartians.com/assets/badges/badge.svg)](http://cultofmartians.com/tasks/postcss-sass.html)

A [Sass](http://sass-lang.com/) parser for [PostCSS](https://github.com/postcss/postcss), using [gonzales-pe](https://github.com/tonyganch/gonzales-pe).

**Not all Sass syntax supported. Parser under development.**

**This module does not compile Sass.** It simply parses mixins as custom at-rules & variables as properties, so that PostCSS plugins can then transform Sass source code alongside CSS.

## Install
`npm i postcss-sass --save`

## Usage
```js
var postcssSass = require("postcss-sass");

postcss(plugins).process(sass, { syntax: postcssSass }).then(function (result) {
    result.content // Sass with transformations
});
```
