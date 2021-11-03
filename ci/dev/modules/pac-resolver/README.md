pac-resolver
============
### Generates an asynchronous resolver function from a [PAC file][pac-wikipedia]
[![Build Status](https://github.com/TooTallNate/node-pac-resolver/workflows/Node%20CI/badge.svg)](https://github.com/TooTallNate/node-pac-resolver/actions?workflow=Node+CI)


This module accepts a JavaScript String of code, which is meant to be a
[PAC proxy file][pac-wikipedia], and returns a generated asynchronous
`FindProxyForURL()` function.


Installation
------------

Install with `npm`:

```bash
$ npm install pac-resolver
```


Example
-------

Given the PAC proxy file named `proxy.pac`:

```js
function FindProxyForURL(url, host) {
  if (isInNet(myIpAddress(), "10.1.10.0", "255.255.255.0")) {
    return "PROXY 1.2.3.4:8080";
  } else {
    return "DIRECT";
  }
}
```

You can consume this PAC file with `pac-resolver` like so:

```js
var fs = require('fs');
var pac = require('pac-resolver');

var FindProxyForURL = pac(fs.readFileSync('proxy.pac'));

FindProxyForURL('http://foo.com/').then((res) => {
  console.log(res);
  // "DIRECT"
});
```


API
---

### pac(String pacFileContents[, Object options]) → Function

Returns an asynchronous `FindProxyForURL()` function based off of the given JS
string `pacFileContents` PAC proxy file. An optional `options` object may be
passed in which respects the following options:

 * `filename` - String - the filename to use in error stack traces. Defaults to `proxy.pac`.
 * `sandbox` - Object - a map of functions to include in the sandbox of the
 JavaScript environment where the JS code will be executed. i.e. if you wanted to
 include the common `alert` function you could pass `alert: console.log`. For
 async functions, you must set the `async = true` property on the function
 instance, and the JS code will be able to invoke the function as if it were
 synchronous.


License
-------

(The MIT License)

Copyright (c) 2013 Nathan Rajlich &lt;nathan@tootallnate.net&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[pac-file-docs]: https://web.archive.org/web/20070602031929/http://wp.netscape.com/eng/mozilla/2.0/relnotes/demo/proxy-live.html
[pac-wikipedia]: http://wikipedia.org/wiki/Proxy_auto-config
