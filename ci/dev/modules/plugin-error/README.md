<p align="center">
  <a href="http://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# plugin-error

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![AppVeyor Build Status][appveyor-image]][appveyor-url] [![Coveralls Status][coveralls-image]][coveralls-url] [![Gitter chat][gitter-image]][gitter-url]

Error handling for Vinyl plugins.

## Usage

```js
var PluginError = require('plugin-error');

var err = new PluginError('test', {
  message: 'something broke'
});

var err = new PluginError({
  plugin: 'test',
  message: 'something broke'
});

var err = new PluginError('test', 'something broke');

var err = new PluginError('test', 'something broke', { showStack: true });

var existingError = new Error('OMG');
var err = new PluginError('test', existingError, { showStack: true });
```

## API

### `new PluginError(pluginName, message[, options])`

Error constructor that takes:
* `pluginName` - a `String` that should be the module name of your plugin
* `message` - a `String` message or an existing `Error` object
* `options` - an `Object` of your options

**Behavior:**

* By default the stack will not be shown. Set `options.showStack` to true if you think the stack is important for your error.
* If you pass an error object as the message the stack will be pulled from that, otherwise one will be created.
* If you pass in a custom stack string you need to include the message along with that.
* Error properties will be included in `err.toString()`, but may be omitted by including `{ showProperties: false }` in the options.

## License

MIT

[downloads-image]: http://img.shields.io/npm/dm/plugin-error.svg
[npm-url]: https://www.npmjs.com/package/plugin-error
[npm-image]: http://img.shields.io/npm/v/plugin-error.svg

[travis-url]: https://travis-ci.org/gulpjs/plugin-error
[travis-image]: http://img.shields.io/travis/gulpjs/plugin-error.svg?label=travis-ci

[appveyor-url]: https://ci.appveyor.com/project/gulpjs/plugin-error
[appveyor-image]: https://img.shields.io/appveyor/ci/gulpjs/plugin-error.svg?label=appveyor

[coveralls-url]: https://coveralls.io/r/gulpjs/plugin-error
[coveralls-image]: http://img.shields.io/coveralls/gulpjs/plugin-error/master.svg

[gitter-url]: https://gitter.im/gulpjs/gulp
[gitter-image]: https://badges.gitter.im/gulpjs/gulp.svg
