# [gulp](https://github.com/gulpjs/gulp)-watch [![Build Status: Linux][travis-image]][travis-url] [![Build Status: Windows][appveyor-image]][appveyor-url] [![Dependency Status][depstat-image]][depstat-url]

File watcher that uses super-fast [chokidar](https://github.com/paulmillr/chokidar) and emits vinyl objects.

## Installation

```
npm install --save-dev gulp-watch
```

## Usage

```js
var gulp = require('gulp'),
    watch = require('gulp-watch');

gulp.task('stream', function () {
	// Endless stream mode
    return watch('css/**/*.css', { ignoreInitial: false })
        .pipe(gulp.dest('build'));
});

gulp.task('callback', function () {
	// Callback mode, useful if any plugin in the pipeline depends on the `end`/`flush` event
    return watch('css/**/*.css', function () {
        gulp.src('css/**/*.css')
            .pipe(gulp.dest('build'));
    });
});
```

> __Protip:__ until gulpjs 4.0 is released, you can use [gulp-plumber](https://github.com/floatdrop/gulp-plumber) to prevent stops on errors.

More examples can be found in [`docs/readme.md`](/docs/readme.md).

## API

### watch(glob, [options, callback])

Creates a watcher that will spy on files that are matched by `glob` which can be a
glob string or array of glob strings.

Returns a pass through stream that will emit vinyl files
(with additional `event` property) that corresponds to event on file-system.

#### Callback `function(vinyl)`

This function is called when events happen on the file-system.
All incoming files that are piped in are grouped and passed to the `events` stream as is.

 * `vinyl` — is [vinyl](https://github.com/wearefractal/vinyl) object that corresponds to the file that caused the event. Additional `event` field is added to determine what caused changes.

Possible events:

 * `add` - file was added to watch or created
 * `change` - file was changed
 * `unlink` - file was deleted

#### Options

This object is passed to the [`chokidar` options](https://github.com/paulmillr/chokidar#api) directly. Options for [`gulp.src`](https://github.com/gulpjs/gulp/blob/master/docs/API.md#options) are also available. If you do not want content from `watch`, then add `read: false` to the `options` object.

#### options.[ignoreInitial](https://github.com/paulmillr/chokidar#path-filtering)
Type: `Boolean`  
Default: `true`

> Indicates whether chokidar should ignore the initial add events or not.

#### options.events
Type: `Array`  
Default: `['add', 'change', 'unlink']`

List of events, that should be watched by gulp-watch. Contains [event names from chokidar](https://github.com/paulmillr/chokidar#events).

#### options.base
Type: `String`  
Default: `undefined`

Use explicit base path for files from `glob`. Read more about `base` and `cwd` in [gulpjs docs](https://github.com/gulpjs/gulp/blob/master/docs/API.md#options).

#### options.name
Type: `String`  
Default: `undefined`

Name of the watcher. If it is present in options, you will get more readable output.

#### options.verbose
Type: `Boolean`  
Default: `false`

This option will enable verbose output.

#### options.readDelay
Type: `Number`  
Default: `10`

Wait for `readDelay` milliseconds before reading the file.

#### options.read
Type: `Boolean`  
Default: `true`

Setting this to `false` will return `file.contents` as null and not read the file at all. Most useful as an optimization if your plugins pipeline doesn't make use of the file contents (e.g. `gulp-clean`), or to avoid reading the file twice if you use `gulp.src()` inside the callback instead of the file object that is passed as argument.

### Methods

Returned `Stream` from constructor has some useful methods:

 * `add(path / paths)`
 * `unwatch(path / paths)`
 * `close()`

### Events

All events from [chokidar](http://npmjs.com/chokidar):

 * `add`, `change`, `unlink`, `addDir`, `unlinkDir`, `error`, `ready`, `raw`


### [Changelog](https://github.com/floatdrop/gulp-watch/releases)

## License

MIT (c) 2014 Vsevolod Strukchinsky (floatdrop@gmail.com)

[npm-url]: https://npmjs.org/package/gulp-watch
[npm-image]: http://img.shields.io/npm/v/gulp-watch.svg?style=flat

[travis-url]: https://travis-ci.org/floatdrop/gulp-watch
[travis-image]: http://img.shields.io/travis/floatdrop/gulp-watch.svg?style=flat

[appveyor-url]: https://ci.appveyor.com/project/floatdrop/gulp-watch/branch/master
[appveyor-image]: https://ci.appveyor.com/api/projects/status/gmjwsqmxht1m131s/branch/master?svg=true

[depstat-url]: https://david-dm.org/floatdrop/gulp-watch
[depstat-image]: http://img.shields.io/david/floatdrop/gulp-watch.svg?style=flat
