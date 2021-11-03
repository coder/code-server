pac-proxy-agent
===============
### A [PAC file][pac-wikipedia] proxy `http.Agent` implementation for HTTP and HTTPS
[![Build Status](https://github.com/TooTallNate/node-pac-proxy-agent/workflows/Node%20CI/badge.svg)](https://github.com/TooTallNate/node-pac-proxy-agent/actions?workflow=Node+CI)

This module provides an `http.Agent` implementation that retreives the specified
[PAC proxy file][pac-wikipedia] and uses it to resolve which HTTP, HTTPS, or
SOCKS proxy, or if a direct connection should be used to connect to the
HTTP endpoint.

It is designed to be be used with the built-in `http` and `https` modules.


Installation
------------

Install with `npm`:

``` bash
$ npm install pac-proxy-agent
```


Example
-------

``` js
var url = require('url');
var http = require('http');
var PacProxyAgent = require('pac-proxy-agent');

// URI to a PAC proxy file to use (the "pac+" prefix is stripped)
var proxy = 'pac+https://cloudup.com/ceGH2yZ0Bjp+';
console.log('using PAC proxy proxy file at %j', proxy);

// HTTP endpoint for the proxy to connect to
var endpoint = 'http://nodejs.org/api/';
console.log('attempting to GET %j', endpoint);
var opts = url.parse(endpoint);

// create an instance of the `PacProxyAgent` class with the PAC file location
var agent = new PacProxyAgent(proxy);
opts.agent = agent;

http.get(opts, function (res) {
  console.log('"response" event!', res.headers);
  res.pipe(process.stdout);
});
```


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

[pac-wikipedia]: http://wikipedia.org/wiki/Proxy_auto-config
