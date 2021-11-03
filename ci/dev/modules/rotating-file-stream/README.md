# rotating-file-stream

[![Build Status][travis-badge]][travis-url]
[![Code Climate][code-badge]][code-url]
[![Test Coverage][cover-badge]][code-url]
[![Donate][donate-badge]][donate-url]

[![NPM version][npm-badge]][npm-url]
[![Types][types-badge]][npm-url]
[![NPM downloads][npm-downloads-badge]][npm-url]
[![Stars][stars-badge]][github-url]

[![Dependencies][dep-badge]][dep-url]
[![Dev Dependencies][dev-dep-badge]][dev-dep-url]
[![Dependents][deps-badge]][npm-url]

[code-badge]: https://codeclimate.com/github/iccicci/rotating-file-stream/badges/gpa.svg
[code-url]: https://codeclimate.com/github/iccicci/rotating-file-stream
[cover-badge]: https://codeclimate.com/github/iccicci/rotating-file-stream/badges/coverage.svg
[dep-badge]: https://david-dm.org/iccicci/rotating-file-stream.svg
[dep-url]: https://david-dm.org/iccicci/rotating-file-stream
[deps-badge]: https://badgen.net/npm/dependents/rotating-file-stream?icon=npm
[dev-dep-badge]: https://david-dm.org/iccicci/rotating-file-stream/dev-status.svg
[dev-dep-url]: https://david-dm.org/iccicci/rotating-file-stream?type=dev
[donate-badge]: https://badgen.net/badge/donate/bitcoin?icon=bitcoin
[donate-url]: https://blockchain.info/address/12p1p5q7sK75tPyuesZmssiMYr4TKzpSCN
[github-url]: https://github.com/iccicci/rotating-file-stream
[npm-downloads-badge]: https://badgen.net/npm/dw/rotating-file-stream?icon=npm
[npm-badge]: https://badgen.net/npm/v/rotating-file-stream?color=green&icon=npm
[npm-url]: https://www.npmjs.com/package/rotating-file-stream
[stars-badge]: https://badgen.net/github/stars/iccicci/rotating-file-stream?icon=github
[travis-badge]: https://badgen.net/travis/iccicci/rotating-file-stream?icon=travis
[travis-url]: https://travis-ci.org/iccicci/rotating-file-stream?branch=master
[types-badge]: https://badgen.net/npm/types/rotating-file-stream?color=green&icon=typescript

### Description

Creates a [stream.Writable](https://nodejs.org/api/stream.html#stream_class_stream_writable) to a file which is
rotated. Rotation behaviour can be deeply customized; optionally, classical UNIX **logrotate** behaviour can be used.

### Usage

```javascript
const rfs = require("rotating-file-stream");
const stream = rfs.createStream("file.log", {
  size: "10M", // rotate every 10 MegaBytes written
  interval: "1d", // rotate daily
  compress: "gzip" // compress rotated files
});
```

### Installation

With [npm](https://www.npmjs.com/package/rotating-file-stream):

```sh
$ npm install --save rotating-file-stream
```

### Table of contents

- [Upgrading from v1.x.x to v2.x.x](#upgrading-from-v1xx-to-v2xx)
- [API](#api)
  - [rfs.createStream(filename[, options])](#rfscreatestreamfilename-options)
    - [filename](#filename)
      - [filename(time[, index])](#filenametime-index)
      - [filename(index)](#filenameindex)
  - [Class: RotatingFileStream](#class-rotatingfilestream)
    - [Event: 'history'](#event-history)
    - [Event: 'open'](#event-open)
    - [Event: 'removed'](#event-removed)
    - [Event: 'rotation'](#event-rotation)
    - [Event: 'rotated'](#event-rotated)
    - [Event: 'warning'](#event-warning)
  - [options](#options)
    - [compress](#compress)
    - [encoding](#encoding)
    - [history](#history)
    - [immutable](#immutable)
    - [initialRotation](#initialrotation)
    - [interval](#interval)
    - [intervalBoundary](#intervalboundary)
    - [maxFiles](#maxfiles)
    - [maxSize](#maxsize)
    - [mode](#mode)
    - [path](#path)
    - [rotate](#rotate)
    - [size](#size)
    - [teeToStdout](#teeToStdout)
- [Rotation logic](#rotation-logic)
- [Under the hood](#under-the-hood)
- [Compatibility](#compatibility)
- [TypeScript](#typescript)
- [Licence](#licence)
- [Bugs](#bugs)
- [ChangeLog](#changelog)
- [Donating](#donating)

# Upgrading from v1.x.x to v2.x.x

There are two main changes in package interface.

In **v1** the _default export_ of the packege was directly the **RotatingFileStream** _constructor_ and the caller
have to use it; while in **v2** there is no _default export_ and the caller should use the
[createStream](#rfscreatestreamfilename-options) exported function and should not directly use
[RotatingFileStream](#class-rotatingfilestream) class.
This is quite easy to discover: if this change is not applied, nothing than a runtime error can happen.

The other important change is the removal of option **rotationTime** and the introduction of **intervalBoundary**.
In **v1** the `time` argument passed to the _filename generator_ function, by default, is the time when _rotaion job_
started, while if [`options.interval`](#interval) option is used, it is the lower boundary of the time interval within
_rotaion job_ started. Later I was asked to add the possibility to restore the default value for this argument so I
introduced `options.rotationTime` option with this purpose. At the end the result was something a bit confusing,
something I never liked.
In **v2** the `time` argument passed to the _filename generator_ function is always the time when _rotaion job_
started, unless [`options.intervalBoundary`](#intervalboundary) option is used. In a few words, to maintain back compatibility
upgrading from **v1** to **v2**, just follow this rules:

- using [`options.rotation`](#rotation): nothing to do
- not using [`options.rotation`](#rotation):
  - not using [`options.interval`](#interval): nothing to do
  - using [`options.interval`](#interval):
    - using `options.rotationTime`: to remove it
    - not using `options.rotationTime`: then use [`options.intervalBoundary`](#intervalboundary).

# API

```javascript
const rfs = require("rotating-file-stream");
```

## rfs.createStream(filename[, options])

- `filename` [&lt;string>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) |
  [&lt;Function>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function) The name
  of the file or the function to generate it, called _file name generator_. See below for
  [details](#filename-stringfunction).
- `options` [&lt;Object>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
  Rotation options, See below for [details](#options).
- Returns: [&lt;RotatingFileStream>](#class-rotatingfilestream) The **rotating file stream**!

This interface is inspired to
[fs.createWriteStream](https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options) one. The file is rotated
following _options_ rules.

### filename

The most complex problem about file name is: "how to call the rotated file name?"

The answer to this question may vary in many forms depending on application requirements and/or specifications.
If there are no requirements, a `string` can be used and _default rotated file name generator_ will be used;
otherwise a `Function` which returns the _rotated file name_ can be used.

**Note:**
if part of returned destination path does not exists, the rotation job will try to create it.

#### filename(time[, index])

- `time` [&lt;Date>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

  - By default: the time when rotation job started;
  - if both [`options.interval`](#interval) and [`intervalBoundary`](#intervalboundary) options are enabled: the start
    time of rotation period.

  If `null`, the _not-rotated file name_ must be returned.

- `index` [&lt;number>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) The
  progressive index of rotation by size in the same rotation period.

An example of a complex _rotated file name generator_ function could be:

```javascript
const pad = num => (num > 9 ? "" : "0") + num;
const generator = (time, index) => {
  if (!time) return "file.log";

  var month = time.getFullYear() + "" + pad(time.getMonth() + 1);
  var day = pad(time.getDate());
  var hour = pad(time.getHours());
  var minute = pad(time.getMinutes());

  return `${month}/${month}${day}-${hour}${minute}-${index}-file.log`;
};

const rfs = require("rotating-file-stream");
const stream = rfs(generator, {
  size: "10M",
  interval: "30m"
});
```

**Note:**
if both of [`options.interval`](#interval) [`options.size`](#size) are used, returned _rotated file name_ **must** be
function of both arguments `time` and `index`.

#### filename(index)

- `index` [&lt;number>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) The
  progressive index of rotation. If `null`, the _not-rotated file name_ must be returned.

If classical **logrotate** behaviour is enabled (by [`options.rotate`](#rotate)), _rotated file name_ is only a
function of `index`.

## Class: RotatingFileStream

Extends [stream.Writable](https://nodejs.org/api/stream.html#stream_class_stream_writable). It should not be directly
used. Exported only to be used with `instanceof` operator and similar.

### Event: 'history'

The `history` event is emitted once the _history check job_ is completed.

### Event: 'open'

- `filename` [&lt;string>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) Is
  constant unless [`options.immutable`](#immutable) is `true`.

The `open` event is emitted once the _not-rotated file_ is opened.

### Event: 'removed'

- `filename` [&lt;string>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) The
  name of the removed file.
- `number` [&lt;boolean>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)
  - `true` if the file was removed due to [`options.maxFiles`](#maxFiles)
  - `false` if the file was removed due to [`options.maxSize`](#maxSize)

The `removed` event is emitted once a _rotated file_ is removed due to [`options.maxFiles`](#maxFiles) or
[`options.maxSize`](#maxSize).

### Event: 'rotation'

The `rotation` event is emitted once the _rotation job_ is started.

### Event: 'rotated'

- `filename` [&lt;string>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) The
  _rotated file name_ produced.

The `rotated` event is emitted once the _rotation job_ is completed.

### Event: 'warning'

- `error` [&lt;Error>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) The
  non blocking error.

The `warning` event is emitted once a non blocking error happens.

## options

- [`compress`](#compress):
  [&lt;boolean>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type) |
  [&lt;string>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) |
  [&lt;Function>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)
  Specifies compression method of rotated files. **Default:** `null`.
- [`encoding`](#encoding):
  [&lt;string>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
  Specifies the default encoding. **Default:** `'utf8'`.
- [`history`](#history):
  [&lt;string>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
  Specifies the _history filename_. **Default:** `null`.
- [`immutable`](#immutable):
  [&lt;boolean>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)
  Never mutate file names. **Default:** `null`.
- [`initialRotation`](#initialRotation):
  [&lt;boolean>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)
  Initial rotation based on _not-rotated file_ timestamp. **Default:** `null`.
- [`interval`](#interval):
  [&lt;string>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
  Specifies the time interval to rotate the file. **Default:** `null`.
- [`intervalBoundary`](#intervalBoundary):
  [&lt;boolean>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)
  Makes rotated file name with lower boundary of rotation period. **Default:** `null`.
- [`maxFiles`](#maxFiles):
  [&lt;number>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)
  Specifies the maximum number of rotated files to keep. **Default:** `null`.
- [`maxSize`](#maxSize):
  [&lt;string>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
  Specifies the maximum size of rotated files to keep. **Default:** `null`.
- [`mode`](#mode):
  [&lt;number>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)
  Proxied to [fs.createWriteStream](https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options).
  **Default:** `0o666`.
- [`path`](#path):
  [&lt;string>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
  Specifies the base path for files. **Default:** `null`.
- [`rotate`](#rotate):
  [&lt;number>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)
  Enables the classical UNIX **logrotate** behaviour. **Default:** `null`.
- [`size`](#size):
  [&lt;string>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
  Specifies the file size to rotate the file. **Default:** `null`.
- [`teeToStdout`](#teeToStdout):
  [&lt;boolean>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)
  Writes file content to `stdout` as well. **Default:** `null`.

### encoding

Specifies the default encoding that is used when no encoding is specified as an argument to
[stream.write()](https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback).

### mode

Proxied to [fs.createWriteStream](https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options).

### path

If present, it is prepended to generated file names as well as for history file.

### teeToStdout

If `true`, it makes the file content to be written to `stdout` as well. Useful for debugging puposes.

### size

Accepts a positive integer followed by one of these possible letters:

- **B**: Bites
- **K**: KiloBites
- **M**: MegaBytes
- **G**: GigaBytes

```javascript
  size: '300B', // rotates the file when size exceeds 300 Bytes
                // useful for tests
```

```javascript
  size: '300K', // rotates the file when size exceeds 300 KiloBytes
```

```javascript
  size: '100M', // rotates the file when size exceeds 100 MegaBytes
```

```javascript
  size: '1G', // rotates the file when size exceeds a GigaByte
```

### interval

Accepts a positive integer followed by one of these possible letters:

- **s**: seconds. Accepts integer divider of 60.
- **m**: minutes. Accepts integer divider of 60.
- **h**: hours. Accepts integer divider of 24.
- **d**: days. Accepts integer.
- **M**: months. Accepts integer. **EXPERIMENTAL**

```javascript
  interval: '5s', // rotates at seconds 0, 5, 10, 15 and so on
                  // useful for tests
```

```javascript
  interval: '5m', // rotates at minutes 0, 5, 10, 15 and so on
```

```javascript
  interval: '2h', // rotates at midnight, 02:00, 04:00 and so on
```

```javascript
  interval: '1d', // rotates at every midnight
```

```javascript
  interval: '1M', // rotates at every midnight between two distinct months
```

### intervalBoundary

If set to `true`, the argument `time` of _filename generator_ is no longer the time when _rotation job_ started, but
the _lower boundary_ of rotation interval.

**Note:**
this option has effect only if [`options.interval`](#interval) is used.

### initialRotation

When program stops in a rotation period then restarts in a new rotation period, logs of different rotation period will
go in the next rotated file; in a few words: a rotation job is lost. If this option is set to `true` an initial check
is performed against the _not-rotated file_ timestamp and, if it falls in a previous rotation period, an initial
rotation job is done as well.

**Note:**
this option has effect only if [`options.intervalBoundary`](#intervalboundary) is used.

### compress

For historical reasons external compression can be used, but the best choice is to use the value `"gzip"`.

To enable external compression, a _function_ can be used or simply the _boolean_ `true` value to use default
external compression.
The function should accept `source` and `dest` file names and must return the shell command to be executed to
compress the file.
The two following code snippets have exactly the same effect:

```javascript
var rfs = require("rotating-file-stream");
var stream = rfs("file.log", {
  size: "10M",
  compress: true
});
```

```javascript
var rfs = require("rotating-file-stream");
var stream = rfs("file.log", {
  size: "10M",
  compress: (source, dest) => "cat " + source + " | gzip -c9 > " + dest
});
```

**Note:**
this option is ignored if [`options.immutable`](#immutable) is used.

**Note:**
the shell command to compress the rotated file should not remove the source file, it will be removed by the package
if rotation job complete with success.

### initialRotation

When program stops in a rotation period then restarts in a new rotation period, logs of different rotation period will
go in the next rotated file; in a few words: a rotation job is lost. If this option is set to `true` an initial check
is performed against the _not-rotated file_ timestamp and, if it falls in a previous rotation period, an initial
rotation job is done as well.

**Note:**
this option has effect only if both [`options.interval`](#interval) and [`options.intervalBoundary`](#intervalboundary)
are used.

**Note:**
this option is ignored if [`options.rotate`](#rotate) is used.

### rotate

If specified, classical UNIX **logrotate** behaviour is enabled and the value of this option has same effect in
_logrotate.conf_ file.

**Note:**
if this optoin is used following ones take no effect: [`options.history`](#history), [`options.immutable`](#immutable),
[`options.initialRotation`](#initialrotation), [`options.intervalBoundary`](#intervalboundary),
[`options.maxFiles`](#maxfiles), [`options.maxSize`](#maxsize).

### immutable

If set to `true`, names of generated files never changes. New files are immediately generated with their rotated
name. In other words the _rotated file name generator_ is never called with a `null` _time_ argument unless to
determinate the _history file_ name; this can happen if [`options.history`](#history) is not used while
[`options.maxFiles`](#maxfiles) or [`options.maxSize`](#maxsize) are used.
The `filename` argument passed to [`'open'`](#event-open) _event_ evaluates now as the newly created file name.

Useful to send logs to logstash through filebeat.

**Note:**
if this option is used, [`options.compress`](#compress) is ignored.

**Note:**
this option is ignored if [`options.interval`](#interval) is not used.

### history

Due to the complexity that _rotated file names_ can have because of the _filename generator function_, if number or
size of rotated files should not exceed a given limit, the package needs a file where to store this information. This
option specifies the name _history file_. This option takes effect only if at least one of
[`options.maxFiles`](#maxfiles) or [`options.maxSize`](#maxsize) is used. If `null`, the _not rotated filename_ with
the `'.txt'` suffix is used.

### maxFiles

If specified, it's value is the maximum number of _rotated files_ to be kept.

### maxSize

If specified, it's value must respect same syntax of [option.size](#size) and is the maximum size of _rotated files_ to
be kept.

# Rotation logic

Regardless of when and why rotation happens, the content of a single
[stream.write](https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback)
will never be split among two files.

## by size

Once the _not-rotated_ file is opened first time, its size is checked and if it is greater or equal to
size limit, a first rotation happens. After each
[stream.write](https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback),
the same check is performed.

## by interval

The package sets a [Timeout](https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args)
to start a rotation job at the right moment.

# Under the hood

Logs should be handled so carefully, so this package tries to never overwrite files.

At stream creation, if the _not-rotated_ log file already exists and its size exceeds the rotation size,
an initial rotation attempt is done.

At each rotation attempt a check is done to verify that destination rotated file does not exists yet;
if this is not the case a new destination _rotated file name_ is generated and the same check is
performed before going on. This is repeated until a not existing destination file name is found or the
package is exhausted. For this reason the _rotated file name generator_ function could be called several
times for each rotation job.

If requested through [`options.maxFiles`](#maxfiles) or [`options.maxSize`](#maxsize), at the end of a rotation job, a
check is performed to ensure that given limits are respected. This means that
**while rotation job is running both the limits could be not respected**. The same can happen till the end of first
_rotation job_ if [`options.maxFiles`](#maxfiles) or [`options.maxSize`](#maxsize) are changed between two runs.
The first check performed is the one against [`options.maxFiles`](#maxfiles), in case some files are removed, then the
check against [`options.maxSize`](#maxsize) is performed, finally other files can be removed. When
[`options.maxFiles`](#maxfiles) or [`options.maxSize`](#maxsize) are enabled for first time, an _history file_ can be
created with one _rotated filename_ (as returned by _filename generator function_) at each line.

Once an **error** _event_ is emitted, nothing more can be done: the stream is closed as well.

# Compatibility

Requires **Node.js v10.x**.

The package is tested under [all Node.js versions](https://travis-ci.org/iccicci/rotating-file-stream)
currently supported accordingly to [Node.js Release](https://github.com/nodejs/Release#readme).

To work with the package under Windows, be sure to configure `bash.exe` as your _script-shell_.

```
> npm config set script-shell bash.exe
```

# TypeScript

Exported in **TypeScript**.

```typescript
import { Writable } from "stream";
export declare type Compressor = (source: string, dest: string) => string;
export declare type Generator = (time: number | Date, index?: number) => string;
export interface Options {
  compress?: boolean | string | Compressor;
  encoding?: BufferEncoding;
  history?: string;
  immutable?: boolean;
  initialRotation?: boolean;
  interval?: string;
  intervalBoundary?: boolean;
  maxFiles?: number;
  maxSize?: string;
  mode?: number;
  path?: string;
  rotate?: number;
  size?: string;
  teeToStdout?: boolean;
}
export declare class RotatingFileStream extends Writable {}
export declare function createStream(filename: string | Generator, options?: Options): RotatingFileStream;
```

# Licence

[MIT Licence](https://github.com/iccicci/rotating-file-stream/blob/master/LICENSE)

# Bugs

Do not hesitate to report any bug or inconsistency [@github](https://github.com/iccicci/rotating-file-stream/issues).

# ChangeLog

[ChangeLog](https://github.com/iccicci/rotating-file-stream/blob/master/CHANGELOG.md)

# Donating

If you find useful this package, please consider the opportunity to donate some satoshis to this bitcoin address:
**12p1p5q7sK75tPyuesZmssiMYr4TKzpSCN**
