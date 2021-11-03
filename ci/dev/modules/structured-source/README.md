StructuredSource
==============


## About

Provides StructuredSource and functionality for converting range and loc vice versa.

## Installation

```sh
npm install structured-source
```


## Usage

```js
const  StructuredSource = require('structured-source');

let src = new StructuredSource('aaa\u2028aaaa\u2029aaaaa\n');

// positionToIndex({ line: number, column: number) -> number
assert(src.positionToIndex({ line: 1, column: 2 }) === 2);

// indexToPosition(number) -> { line: number, column: number }
assert.deepEqual(src.indexToPosition(2), { line: 1, column: 2 });

// rangeToLocation([ number, number ]) -> { start: { line: number, column: number}, end: { line: number, column: number } }
assert.deepEqual(src.rangeToLocation([0, 2]), {
    start: { line: 1, column: 0 },
    end: { line: 1, column: 2 }
});

// locationToRange({ start: { line: number, column: number}, end: { line: number, column: number } }) -> [ number, number ]
assert.deepEqual(src.locationToRange({
    start: { line: 1, column: 0 },
    end: { line: 1, column: 2 }
}), [0, 2]);
```

### License

Copyright (C) 2012-2014 [Yusuke Suzuki](http://github.com/Constellation)
 (twitter: [@Constellation](http://twitter.com/Constellation)) and other contributors.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.

  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
