# SugarSS [![Build Status][ci-img]][ci]

<img align="right" width="120" height="155"
     title="SugarSS logo by Maria Keller"
     src="http://postcss.github.io/sugarss/logo.svg">

Indent-based CSS syntax for [PostCSS].

```sass
a
  color: blue

.multiline,
.selector
  box-shadow: 1px 0 9px rgba(0, 0, 0, .4),
              1px 0 3px rgba(0, 0, 0, .6)

// Mobile
@media (max-width: 400px)
  .body
    padding: 0 10px
```

As any PostCSS custom syntax, SugarSS has source map, [stylelint]
and [postcss-sorting] support out-of-box.

It was designed to be used with [PreCSS] and [postcss-nested-props].
But you can use it with any PostCSS plugins
or use it without any PostCSS plugins.
With [gulp-sass-to-postcss-mixins] you can use `+mixin` syntax as in Sass.

<a href="https://evilmartians.com/?utm_source=sugarss">
  <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
       alt="Sponsored by Evil Martians" width="236" height="54">
</a>

[gulp-sass-to-postcss-mixins]:  https://github.com/akella/gulp-sass-to-postcss-mixins
[postcss-nested-props]:        https://github.com/jedmao/postcss-nested-props
[postcss-sorting]:             https://github.com/hudochenkov/postcss-sorting
[stylelint]:                   http://stylelint.io/
[PostCSS]:                     https://github.com/postcss/postcss
[PreCSS]:                      https://github.com/jonathantneal/precss
[ci-img]:                      https://img.shields.io/travis/postcss/sugarss.svg
[ci]:                          https://travis-ci.org/postcss/sugarss

## Syntax

SugarSS MIME-type is `text/x-sugarss` with `.sss` file extension.

### Indent

We recommend 2 spaces indent. However, SugarSS autodetects indent
and can be used with tabs or spaces.

But it is prohibited to mix spaces and tabs in SugarSS sources.

### Multiline

SugarSS was designed to have intuitively multiline selectors and declaration
values.

There are 3 rules for any types of nodes:

```sass
// 1. New line inside brackets will be ignored
@supports ( (display: flex) and
            (display: grid) )

// 2. Comma at the end of the line
@media (max-width: 400px),
       (max-height: 800px)

// 3. Backslash before new line
@media screen and \
       (min-width: 600px)
```

In selector you can put a new line anywhere. Just keep same indent
for every line of selector:

```sass
.parent >
.child
  color: black
```

In declaration value you can put new line anywhere. Just keep bigger indent
for value:

```sass
.one
  background: linear-gradient(rgba(0, 0, 0, 0), black)
              linear-gradient(red, rgba(255, 0, 0, 0))

.two
  background:
    linear-gradient(rgba(0, 0, 0, 0), black)
    linear-gradient(red, rgba(255, 0, 0, 0))
```

### Comments

SugarSS supports two types of comments:

```sass
/*
 Multiline comments
 */

// Inline comments
```

There is no “silent” comments in SugarSS. Output CSS will contain all comments
from `.sss` source. But you can use [postcss-discard-comments]
for Sass’s silent/loud comments behaviour.

[postcss-discard-comments]: https://www.npmjs.com/package/postcss-discard-comments

### Rule and Declarations

SugarSS separates selectors and declarations by `:\s` or `:\n` token.

So you must write a space after property name: `color: black` is good,
`color:black` is prohibited.

## Text Editors

* SublimeText: [Syntax Highlighting for .SSS SugarSS]
* Atom: [language-postcss], [source-preview-postcss] and [build-sugarss]
* Vim: [vim-sugarss]

We are working on syntax highlight support in text editors.

Right now, you can set `Sass` or `Stylus` syntax highlight for `.sss` files.

[Syntax Highlighting for .SSS SugarSS]: https://packagecontrol.io/packages/Syntax%20Highlighting%20for%20SSS%20SugarSS
[source-preview-postcss]:          https://atom.io/packages/source-preview-postcss
[language-postcss]:                https://atom.io/packages/language-postcss
[build-sugarss]:                   https://atom.io/packages/build-sugarss
[vim-sugarss]:                     https://github.com/hhsnopek/vim-sugarss

## Usage

Install SugarSS via npm:

```sh
npm install sugarss --save-dev
```

### SugarSS to CSS

Just set SugarSS to PostCSS `parser` option and PostCSS will compile
SugarSS to CSS.

[Gulp](https://github.com/postcss/gulp-postcss):

```js
var sugarss = require('sugarss');
var postcss = require('gulp-postcss');
var rename  = require('gulp-rename');

gulp.task('style', function () {
    return gulp.src('src/**/*.sss')
        .pipe(postcss(plugins, { parser: sugarss }))
        .pipe(rename({ extname: '.css' }))
        .pipe(gulp.dest('build'));
});
```

[Webpack](https://github.com/postcss/postcss-loader):

```js
module: {
    loaders: [
        {
            test:   /\.sss/,
            loader: "style-loader!css-loader!postcss-loader?parser=sugarss"
        }
    ]
}
```

[CLI](https://github.com/postcss/postcss-cli):

```
postcss -u autoprefixer -p sugarss test.sss -o test.css
```

### SugarSS to SugarSS

Sometimes we use PostCSS not to build CSS, but to fix source file.
For example, to sort properties by [postcss-sorting].

For this cases, use `syntax` option, instead of `parser`:

```js
gulp.task('sort', function () {
    return gulp.src('src/**/*.sss')
        .pipe(postcss([sorting], { syntax: sugarss }))
        .pipe(gulp.dest('src'));
});
```

[postcss-sorting]: https://github.com/hudochenkov/postcss-sorting

### CSS to SugarSS

You can even compile existed CSS sources to SugarSS syntax.
Just use `stringifier` option instead of `parser`:

```js
postcss().process(css, { stringifier: sugarss }).then(function (result) {
    result.content // Converted SugarSS content
});
```

### Imports

[postcss-import] doesn’t support `.sss` file extension, because this plugin
implements W3C specification. If you want smarter `@import`, you should
use [postcss-easy-import] with `extensions` option.

```js
var postcssPlugin = [
  easyImport({ extensions: ['.sss'] })
]
```

[postcss-easy-import]: https://github.com/TrySound/postcss-easy-import
[postcss-import]:      https://github.com/postcss/postcss-import

## Thanks

Cute project logo was made by [Maria Keller](http://www.mariakellerac.com/).
