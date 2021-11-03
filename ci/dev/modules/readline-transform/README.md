# ReadlineTransform

[![npm](https://img.shields.io/npm/v/readline-transform.svg)](https://www.npmjs.com/package/readline-transform)
[![Node](https://img.shields.io/node/v/readline-transform.svg)]()
[![License](https://img.shields.io/github/license/tilfin/readline-transform.svg)]()
[![dependencies Status](https://david-dm.org/tilfin/readline-transform/status.svg)](https://david-dm.org/tilfin/readline-transform)
[![Build Status](https://travis-ci.org/tilfin/readline-transform.svg?branch=master)](https://travis-ci.org/tilfin/readline-transform)
[![Coverage Status](https://coveralls.io/repos/github/tilfin/readline-transform/badge.svg?branch=master)](https://coveralls.io/github/tilfin/readline-transform?branch=master)

Reading String or Buffer content from a Readable stream and writing each line which ends without line break as object

## Install

```
$ npm install -save readline-transform
```

## How to Use

### Create a ReadlineTransform

**new ReadlineTransform(options)**

* `options` `<Object>`
  * `breakMatcher` is the regular expression to split content by line break for `str.split()`. (default: `/\r?\n/`)
  * `ignoreEndOfBreak` is boolean. if content ends with line break, ignore last empty line. (default: `true`)
  * `skipEmpty` is boolean. if line is empty string, skip it (default: `false`)

### An example 

```javascript
const { PassThrough } = require('stream');
const ReadlineTransform = require('readline-transform');

const readStream = new PassThrough();
const transform = new ReadlineTransform({ skipEmpty: true });
const writeStream = new PassThrough({ objectMode: true });

writeStream.on('data', (line) => {
  console.log(line);
}).on('finish', () => {
  console.log('<<< all done >>>');
});

readStream.pipe(transform).pipe(writeStream);

readStream.write(new Buffer('foo\nba'));
readStream.write(new Buffer('r\r\n\n\r'));
readStream.end(new Buffer('\nbaz'));
```

### Console output

```
$ node example.js
foo
bar
baz
<<< all done >>>
```
