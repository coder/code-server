# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

## 2.1.1
* Add `*.d.ts` files to npm package.

## 2.1
* Add TypeScript support (by Natalie Weizenbaum).
* Reduce npm package size.

## 2.0
* Remove Node.js 9 and Node.js 4 support.
* Remove IE and “dead” browsers from Babel.
* Use PostCSS 7.0.

## 1.0.6
* Fix parsing nested at-rules without semicolon, params, and spaces.
* Fix parsing string in interpolation in string.

## 1.0.5
* Fix parsing `url( http://example.com )` with spaces inside.

## 1.0.4
* Fix parsing inline cpmments inside selectors.

## 1.0.3
* Remove development sections from published `package.json`.

## 1.0.2
* Fix escape sequences parsing (by Oleh Kuchuk).

## 1.0.1
* Fix position of multiline `url()`.

## 1.0
* Use PostCSS 6.0.
* Use `babel-preset-env`.

## 0.4.1
* Fix compatibility with PostCSS 5.2.13.

## 0.4
* Add mixed comments support (`// width: 5% /* width: 6% */`)

## 0.3.1
* Fix parsing selector with interpolation in pseudo-class.

## 0.3
* Use PostCSS 5.2.

## 0.2.1
* Fix nested prop parser for prefixed pseudo.

## 0.2
* Add nested properties support (by dryoma).

## 0.1.9
* Use PostCSS 5.1.
* Add source maos to build JS files.
* Fix interpolation in `url()`.

## 0.1.8
* Fix interpolation-in-interpolation parsing.
* Fix at-rule with interpolation parsing.

## 0.1.7
* Fix inline comments with Windows new lines.

## 0.1.6
* Parse new lines according W3C CSS syntax specification.

## 0.1.5
* Fix package dependencies.

## 0.1.4
* Fix CSS syntax error position on unclosed quotes.

## 0.1.3
* Fix ES2015 module export.

## 0.1.2
* Fix interpolation inside string.

## 0.1.1
* Fix `url()` parsing.

## 0.1
* Initial release.
