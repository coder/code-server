<p align="center">
  <a href="http://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# parse-node-version

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Travis Build Status][travis-image]][travis-url] [![AppVeyor Build Status][appveyor-image]][appveyor-url] [![Coveralls Status][coveralls-image]][coveralls-url] [![Gitter chat][gitter-image]][gitter-url]

Turn node's process.version into something useful.

## Usage

```js
var nodeVersion = require('parse-node-version')(process.version);

console.log(
  nodeVersion.major,
  nodeVersion.minor,
  nodeVersion.patch,
  nodeVersion.pre,
  nodeVersion.build
);
```

## API

### parseVersion(nodeVersionString)

Takes a node version string (usually `process.version`) and returns an object with the `major`/`minor`/`patch` (which will all be numbers) and `pre`/`build` keys (which will always be a string). If the version doesn't contain any pre-release or build information, the properties will be returned as empty string.

## License

MIT

[downloads-image]: http://img.shields.io/npm/dm/parse-node-version.svg
[npm-url]: https://www.npmjs.com/package/parse-node-version
[npm-image]: http://img.shields.io/npm/v/parse-node-version.svg

[travis-url]: https://travis-ci.org/gulpjs/parse-node-version
[travis-image]: http://img.shields.io/travis/gulpjs/parse-node-version.svg?label=travis-ci

[appveyor-url]: https://ci.appveyor.com/project/gulpjs/parse-node-version
[appveyor-image]: https://img.shields.io/appveyor/ci/gulpjs/parse-node-version.svg?label=appveyor

[coveralls-url]: https://coveralls.io/r/gulpjs/parse-node-version
[coveralls-image]: http://img.shields.io/coveralls/gulpjs/parse-node-version/master.svg

[gitter-url]: https://gitter.im/gulpjs/gulp
[gitter-image]: https://badges.gitter.im/gulpjs/gulp.svg
