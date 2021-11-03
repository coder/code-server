![urlgrey](https://raw.github.com/cainus/urlgrey/master/urlgrey.png "urlgrey")


[![Build Status](https://travis-ci.org/cainus/urlgrey.png?branch=master)](https://travis-ci.org/cainus/urlgrey)
[![Coverage Status](https://coveralls.io/repos/cainus/urlgrey/badge.png?branch=master)](https://coveralls.io/r/cainus/urlgrey)
[![NPM version](https://badge.fury.io/js/urlgrey.png)](http://badge.fury.io/js/urlgrey)

[![browser support](https://ci.testling.com/cainus/urlgrey.png)](http://ci.testling.com/cainus/urlgrey)

Urlgrey is a library for url manipulation.  It's got a chainable/fluent interface
that makes a number of methods available for querying different aspects of a url, 
and even modifying it to create new urls.

Most methods are named after different parts of the url and allow you to read that part from the 
current url if you don't pass any parameters, or they allow you to generate a new url with a 
change to that part in the current url if you do pass a parameter.

For the examples below, we'll use the following url:
```
https://user:pass@subdomain.asdf.com/path/kid?asdf=1234#frag
```

To create a new urlgrey object, just pass a url to urlgrey like so:
```javascript
var url = urlgrey("https://user:pass@subdomain.asdf.com/path/kid?asdf=1234#frag")
```

## API specifics:

### url.child([lastPart])

Setter/getter for the last part of a path:
```javascript
  url.child(); // returns "kid" 
  url.child("grandkid"); // returns a new uri object with the uri 
                             // https://user:pass@subdomain.asdf.com/path/kid/grandkid?asdf=1234#frag
```   
### url.decode(encodedString);
Returns the decoded version of the input string using node's standard querystring.unescape().
```javascript
      url.decode('this%20is%20a%20test');  // returns "this is a test"
```   
    
### url.encode(unencodedString);
Returns the encoded version of the input string using node's standard querystring.escape().
```javascript
      url.encode('this is a test'); // returns 'this%20is%20a%20test'
```   
    
### url.hash([newHash])
Setter/getter for the url fragment/anchor/hash of a path.
```javascript
      url.hash(); // returns 'frag'
      url.hash("blah"); // returns a new uri object with the uri
                            // https://user:pass@subdomain.asdf.com/path/kid/?asdf=1234#blah
```   
### url.hostname([newHostname])
Setter/getter for the url hostname.
```javascript
      url.hostname(); // returns 'subdomain.asdf.com'
      url.hostname("geocities.com"); // returns a new uri object with the uri
                            // https://user:pass@geocities.com/path/kid/?asdf=1234#frag
```   
### url.parent();
Get the parent URI of the current URI. (This property is read-only).
```javascript
      url.parent();  // returns a new uri object with the uri
                     // https://user:pass@subdomain.asdf.com/path/
```   

### url.password([newPassword]);
Setter/getter for the password portion of the url.
```javascript
      url.password(); // returns 'pass'
      url.password("newpass"); // returns a new uri object with the uri
                            // https://user:newpass@subdomain.asdf.com/path/kid/?asdf=1234#frag
```   
### url.extendedPath([string]);
Setter/getter for the path, querystring and fragment portion of the url
all at once.
```javascript
      url.extendedPath(); // returns '/path/kid?asdf=1234#frag'
      url.extendedPath("/newpath?new=query#newfrag"); // returns a new uri object with the uri
                               // https://user:newpass@subdomain.asdf.com/newpath?new=query#newfrag

```   

### url.path([mixed]);
Setter/getter for the path portion of the url.
```javascript
      url.path(); // returns '/path/kid'
      url.path("newpath"); // returns a new uri object with the uri
                               // https://user:newpass@subdomain.asdf.com/newpath

      // ALSO, .path() can take arrays of strings as input as well:
      url.path(['qwer', '/asdf'], 'qwer/1234/', '/1234/'); 
                      // this returns a new uri object with the uri
                      // https://user:newpass@subdomain.asdf.com/qwer/asdf/qwer/1234/1234
```   
    
Note: changing the path will remove the querystring and hash, since they rarely make sense on a new path.

### url.port([newPort]);
Setter/getter for the port portion of the url.
```javascript
      url.port(); // returns 80
      url.port(8080); // returns a new uri object with the uri
                          // https://user:pass@subdomain.asdf.com:8080/path/kid/?asdf=1234#frag
```   


### url.protocol([newProtocol]);


Setter/getter for the protocol portion of the url.
```javascript
      url.protocol(); // returns 'https'
      url.protocol("http"); // returns a new uri object with the uri
                                // http://user:pass@subdomain.asdf.com/path/kid/?asdf=1234#frag
```   

### url.query([mixed]);

Setter/getter for the querystring using javascript objects.
```javascript
      url.query(); // returns {asdf : 1234}
      url.query(false); // returns a new uri object with the querystring-free uri
                            // https://user:pass@subdomain.asdf.com/path/kid#frag
      url.query({spaced : 'space test'})
                                // returns a new uri object with the input object serialized
                                // and merged into the querystring like so:
                                // https://user:pass@subdomain.asdf.com/path/kid/?asdf=1234&spaced=space%20test#frag
```   
    
NOTE: escaping and unescaping of applicable characters happens automatically. (eg " " to "%20", and vice versa)

NOTE: an input object will overwrite an existing querystring where they have the same names.

NOTE: an input object will remove an existing name-value pair where they have the same names and the value in the input name-value pair is null.


### url.queryString([newQueryString]);

Setter/getter for the querystring using a plain string representation. This is lower-level than .query(), but allows complete control of the querystring.
```javascript
      url.queryString(); // returns asdf=1234  (notice there is no leading '?')
      url.queryString("blah"); // returns a new uri object with a new querystring
                               // https://user:pass@subdomain.asdf.com/path/kid?blah#frag
```   
    
NOTE: no escaping/unescaping of applicable characters will occur. This must be done manually.

### url.rawChild();

This method is the same as url.child() but does not automatically url-encode
any part of the input.

### url.rawPath();
This method is the same as url.path() but does not automatically url-encode
any part of the path.

### url.rawQuery();
This method is the same as url.query() but does not automatically url-encode
any of the keys or values in an input object.


### url.toJson();
Returns the json representation of the uri object, which is simply the uri as a string. The output is exactly the same as .toString(). This method is read-only.
```javascript
  url.toJson(); // returns "https://user:pass@subdomain.asdf.com/path/kid/?asdf=1234#frag"
```   

### url.toString();
Returns the string representation of the uri object, which is simply the uri as a string. This method is read-only.
```javascript
      url.toString(); // returns "https://user:pass@subdomain.asdf.com/path/kid/?asdf=1234#frag"
```   

### url.username([newUsername])
Setter/getter for the username portion of the url.
```javascript
      url.username(); // returns 'user'
      url.username("newuser"); // returns a new uri object with the 
                               // uri https://newuser:pass@subdomain.asdf.com/path/kid/?asdf=1234#frag
```

## Installation:
### node.js:
`npm install urlgrey --save`

Also!  If you're using urlgrey in an http application, see [urlgrey-connect](https://github.com/cainus/urlgrey-connect).  It gives you an urlgrey object already instantiated with the request url as req.uri in all your request handlers.
### in the browser:
Lots of options:
* grab urlgrey.js from the root of this repo for [browserify](http://browserify.org/)-built, unminified version.
* grab urlgrey.min.js from the root of this repo for a [browserify](http://browserify.org/)-built, minified version.
* use [browserify](http://browserify.org/) and include this like any other node package.


## Contributing:
### Testing:
#### Run the node tests:
* `make test`

#### Run the browser file:// tests:
* `make browser-build`
* ...then open test.html in a browser

#### Run the browser tests on a real server:
* `make browser-build`
* `python -m SimpleHTTPServer 9999`
* ...then open http://localhost://9999/test.html in a browser

### Building before committing
* `make precommit`

### Running node tests with a coverage report
* `make test-cov`



 
