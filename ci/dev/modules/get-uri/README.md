get-uri
=======
### Returns a `stream.Readable` from a URI string
[![Build Status](https://github.com/TooTallNate/node-get-uri/workflows/Node%20CI/badge.svg)](https://github.com/TooTallNate/node-get-uri/actions?workflow=Node+CI)

This high-level module accepts a URI string and returns a `Readable` stream
instance. There is built-in support for a variety of "protocols", and it's
easily extensible with more:

| Protocol  | Description                     | Example
|:---------:|:-------------------------------:|:---------------------------------:
| `data`    | [Data URIs][data]               | `data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D`
| `file`    | [File URIs][file]               | `file:///c:/windows/example.ini`
| `ftp`     | [FTP URIs][ftp]                 | `ftp://ftp.kernel.org/pub/site/README`
| `http`    | [HTTP URIs][http]               | `http://www.example.com/path/to/name`
| `https`   | [HTTPS URIs][https]             | `https://www.example.com/path/to/name`


Installation
------------

Install with `npm`:

``` bash
$ npm install get-uri
```


Example
-------

To simply get a `stream.Readable` instance from a `file:` URI, try something like:

``` js
var getUri = require('get-uri');

// `file:` maps to a `fs.ReadStream` instance…
getUri('file:///Users/nrajlich/wat.json', function (err, rs) {
  if (err) throw err;
  rs.pipe(process.stdout);
});
```


Missing Endpoints
-----------------

When you pass in a URI in which the resource referenced does not exist on the
destination server, then a `NotFoundError` will be returned. The `code` of the
error instance is set to `"ENOTFOUND"`, so you can special-case that in your code
to detect when a bad filename is requested:

``` js
getUri('http://example.com/resource.json', function (err, rs) {
  if (err) {
    if ('ENOTFOUND' == err.code) {
      // bad file path requested
    } else {
      // something else bad happened...
      throw err;
    }
  }

  // your app code…
});
```


Cacheability
------------

When calling `getUri()` with the same URI multiple times, the `get-uri` module
supports sending an indicator that the remote resource has not been modified
since the last time it has been retreived from that node process.

To do this, pass in a `cache` option to the "options object" argument
with the value set to the `stream.Readable` instance that was previously
returned. If the remote resource has not been changed since the last call for
that same URI, then a `NotModifiedError` instance will be returned with it's
`code` property set to `"ENOTMODIFIED"`.

When the `"ENOTMODIFIED"` error occurs, then you can safely re-use the
results from the previous `getUri()` call for that same URI:

``` js
// maps to a `fs.ReadStream` instance
getUri('http://example.com/resource.json', function (err, rs) {
  if (err) throw err;

  // … some time later, if you need to get this same URI again, pass in the
  // previous `stream.Readable` instance as `cache` option to potentially
  // receive an "ENOTMODIFIED" response:
  var opts = { cache: rs };
  getUri('http://example.com/resource.json', opts, function (err, rs2) {
    if (err) {
      if ('ENOTFOUND' == err.code) {
        // bad file path requested
      } else if ('ENOTMODIFIED' == err.code) {
        // source file has not been modified since last time it was requested,
        // so `rs2` is undefined and you are expected to re-use results from
        // a previous call to `getUri()`
      } else {
        // something else bad happened...
        throw err;
      }
    }
  });
});
```


API
---

### getUri(String uri[, Object options,] Function callback)

A `uri` String is required. An optional `options` object may be passed in:

 - `cache` - A `stream.Readable` instance from a previous call to `getUri()` with the same URI. If this option is passed in, and the destination endpoint has not been modified, then an `ENOTMODIFIED` error is returned

Any other options passed in to the `options` object will be passed through
to the low-level connection creation functions (`http.get()`, `ftp.connect()`,
etc).

Invokes the given `callback` function with a `stream.Readable` instance to
read the resource at the given `uri`.

License
-------

(The MIT License)

Copyright (c) 2014 Nathan Rajlich &lt;nathan@tootallnate.net&gt;

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

[data]: http://tools.ietf.org/html/rfc2397
[file]: http://tools.ietf.org/html/draft-hoffman-file-uri-03
[ftp]: http://www.w3.org/Protocols/rfc959/
[http]: http://www.w3.org/Protocols/rfc2616/rfc2616.html
[https]: http://wikipedia.org/wiki/HTTP_Secure
