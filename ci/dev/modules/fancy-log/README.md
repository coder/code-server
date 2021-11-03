<p align="center">
  <a href="http://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# fancy-log

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Travis Build Status][travis-image]][travis-url] [![AppVeyor Build Status][appveyor-image]][appveyor-url] [![Coveralls Status][coveralls-image]][coveralls-url] [![Gitter chat][gitter-image]][gitter-url]

Log things, prefixed with a timestamp.

## Usage

```js
var log = require('fancy-log');

log('a message');
// [16:27:02] a message

log.error('oh no!');
// [16:27:02] oh no!
```

## API

### `log(msg...)`

Logs the message as if you called `console.log` but prefixes the output with the
current time in HH:MM:ss format.

### `log.error(msg...)`

Logs the message as if you called `console.error` but prefixes the output with the
current time in HH:MM:ss format.

### `log.warn(msg...)`

Logs the message as if you called `console.warn` but prefixes the output with the
current time in HH:MM:ss format.


### `log.info(msg...)`

Logs the message as if you called `console.info` but prefixes the output with the
current time in HH:MM:ss format.

### `log.dir(msg...)`

Logs the message as if you called `console.dir` but prefixes the output with the
current time in HH:MM:ss format.

## License

MIT

[downloads-image]: http://img.shields.io/npm/dm/fancy-log.svg
[npm-url]: https://www.npmjs.com/package/fancy-log
[npm-image]: http://img.shields.io/npm/v/fancy-log.svg

[travis-url]: https://travis-ci.org/gulpjs/fancy-log
[travis-image]: http://img.shields.io/travis/gulpjs/fancy-log.svg?label=travis-ci

[appveyor-url]: https://ci.appveyor.com/project/gulpjs/fancy-log
[appveyor-image]: https://img.shields.io/appveyor/ci/gulpjs/fancy-log.svg?label=appveyor

[coveralls-url]: https://coveralls.io/r/gulpjs/fancy-log
[coveralls-image]: http://img.shields.io/coveralls/gulpjs/fancy-log/master.svg

[gitter-url]: https://gitter.im/gulpjs/gulp
[gitter-image]: https://badges.gitter.im/gulpjs/gulp.svg
