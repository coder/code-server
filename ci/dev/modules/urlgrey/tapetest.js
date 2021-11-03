var test = require('tape');

var tapetest = function(){
  var isBrowser = !(typeof module !== 'undefined' && module.exports);
  if (!isBrowser){
    var urlgrey = require('./index');
  }

  test('chaining always produces a new object and leaves the original unaffected', 
       function (t) {
    t.plan(2);
    // doesn't over-write the original url
    var urlStr = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
    var url = urlgrey(urlStr);
    t.equal(
      url.hostname('asdf.com').toString(),
      "https://user:pass@asdf.com/path?asdf=1234#frag"
    );
    url.port(8080);
    url.protocol('http');
    url.username('http');
    url.password('http');
    url.path('http');
    url.hash('http');
    url.queryString('http=1234');
    url.query(false);
    url.extendedPath("/asdf?qwer=asdf#swqertwert23");
    t.equal(
      url.toString(),
      urlStr
    ); // original object is unmodified
  });


  test('toJSON() returns the same thing as toString', function(t){
    t.plan(2);
    var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).toJSON(),
      urlgrey(url).toString()
    );
    t.equal(
      'https://user:pass@subdomain.asdf.com/path?asdf=1234#frag',
      urlgrey(url).toString()
    );
  });


  test('hostname() gets the hostname', function(t){
    var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).hostname(),
      'subdomain.asdf.com'
    );
    t.end();
  });

  if (isBrowser){
    test("hostname() gets the hostname even if unset", function(t){
      t.plan(1);
      var url = "/path?asdf=1234#frag";
      var u = urlgrey(url);
      if (u.protocol() === 'file'){
        // chrome uses localhost.  other browsers don't
        t.ok(
          (u.hostname() === '') || (u.hostname() === 'localhost')
        );
      } else {
        t.equal(
          u.hostname(),
          window.location.hostname + ''
        );
      }
    });
  }

  test("hostname() sets the hostname", function(t){
    var url = "http://subdomain.asdf.com";
    t.equal(
      urlgrey(url).hostname("blah").toString(),
      'http://blah'
    );
    t.end();
  });

  test("port() gets the port", function(t){
    var url = "https://user:pass@subdomain.asdf.com:9090";
    t.equal(
      urlgrey(url).port(),
      9090
    );
    t.end();
  });

  test("port() gets a correct default port when it's missing", function(t){
    var url = "https://user:pass@subdomain.asdf.com";
    t.equal(
      urlgrey(url).port(),
      443
    );
    t.end();
  });
  test("port() omits the port when it's 80 for http", function(t){
    var url = "http://subdomain.asdf.com:9090";
    t.equal(
      urlgrey(url).port(80).toString(),
      'http://subdomain.asdf.com'
    );
    t.end();
  });
  test("port() omits the port when it's 443 for https", function(t){
    var url = "https://subdomain.asdf.com:9090";
    t.equal(
      urlgrey(url).port(443).toString(),
      'https://subdomain.asdf.com'
    );
    t.end();
  });
  test("port() sets the port", function(t){
    var url = "https://subdomain.asdf.com";
    t.equal(
      urlgrey(url).port(9090).toString(),
      'https://subdomain.asdf.com:9090'
    );
    t.end();
  });

  test("rawPath() gets the path", function(t){
    var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).rawPath(),
      '/path'
    );
    t.end();
  });
  test("rawPath() sets the path", function(t){
    var url = "https://subdomain.asdf.com";
    t.equal(
      urlgrey(url).rawPath("blah").toString(),
      'https://subdomain.asdf.com/blah'
    );
    t.end();
  });
  test("rawPath() does not encode pieces of the path", function(t){
    var url = "https://subdomain.asdf.com";
    t.equal(
      urlgrey(url).rawPath("not encode here", "and/not/here").toString(),
      'https://subdomain.asdf.com/not encode here/and/not/here'
    );
    t.end();
  });
  test("rawPath() sets the path from strings and arrays of strings", function(t){
    var url = "https://asdf.com";
    t.equal(
      urlgrey(url).rawPath(['qwer', '/asdf'], 'qwer/1234/', '/1234/').toString(),
      'https://asdf.com/qwer/asdf/qwer/1234/1234'
    );
    t.end();
  });
  test("path() gets the path", function(t){
    var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).path(),
      '/path'
    );
    t.end();
  });
  test("path() sets the path", function(t){
    var url = "https://subdomain.asdf.com";
    t.equal(
      urlgrey(url).path("blah").toString(),
      'https://subdomain.asdf.com/blah'
    );
    t.end();
  });
  test("path() url encodes pieces of the path, but not slashes", function(t){
    var url = "https://subdomain.asdf.com";
    t.equal(
      urlgrey(url).path("encode here", "but/not/here").toString(),
      'https://subdomain.asdf.com/encode%20here/but/not/here'
    );
    t.end();
  });
  test("path() sets the path from strings and arrays of strings", function(t){
    var url = "https://asdf.com";
    t.equal(
      urlgrey(url).path(['qwer', '/asdf'], 'qwer/1234/', '/1234/').toString(),
      'https://asdf.com/qwer/asdf/qwer/1234/1234'
    );
    t.end();
  });
  test("hash() gets the hash", function(t){
    var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).hash(),
      'frag'
    );
    t.end();
  });
  test("hash() sets the hash", function(t){
    var url = "https://subdomain.asdf.com";
    t.equal(
      urlgrey(url).hash("blah").toString(),
      'https://subdomain.asdf.com#blah'
    );
    t.end();
  });
  test("password() gets the password", function(t){
    var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).password(),
      'pass'
    );
    t.end();
  });
  test("password() sets the password", function(t){
    var url = "https://user:pass@subdomain.asdf.com";
    t.equal(
      urlgrey(url).password("blah").toString(),
      'https://user:blah@subdomain.asdf.com'
    );
    t.end();
  });


  test("username() gets the username", function(t){
    var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).username(),
      'user'
    );
    t.end();
  });
  test("username() sets the username", function(t){
    var url = "https://user:pass@subdomain.asdf.com";
    t.equal(
      urlgrey(url).username("blah").toString(),
      'https://blah:pass@subdomain.asdf.com'
    );
    t.end();
  });

  test("parent() returns the second-last item in the path if there is no input", function(t){
    var url = "http://asdf.com/path/kid?asdf=1234#frag";
    t.equal(
      urlgrey(url).parent().toString(),
      'http://asdf.com/path'
    );
    t.end();
  });
  test("parent() ignores a trailing slash", function(t){
    var url = "http://asdf.com/path/kid/?asdf=1234#frag";
    t.equal(
      urlgrey(url).parent().toString(),
      'http://asdf.com/path'
    );
    t.end();
  });

  test("parent() throws an exception when no parent path exists", function(t){
    var url = "http://asdf.com/";
    t.plan(1);
    try {
      urlgrey(url).parent();
      t.fail("expected exception was not raised.");
    } catch (ex){
      t.equal(
        ex.message,
        'The current path has no parent path'
      );
    }
  });

  test("extendedPath() returns the part of the url after the host:port", function(t){
    var url = "http://asdf.com:8080/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).extendedPath(),
      '/path?asdf=1234#frag'
    );
    t.end();
  });
  test("extendedPath() lets you set the part of the url after the host:port", function(t){
    var url = "http://asdf.com:8080/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).extendedPath('/asdf?qwer=1234#fraggle').toString(),
      'http://asdf.com:8080/asdf?qwer=1234#fraggle'
    );
    t.end();
  });

  test("rawChild() returns a url with the given path suffix added", function(t){
    var url = "http://asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).rawChild('kid here').toString(),
      'http://asdf.com/path/kid here'
    );
    t.end();
  });
  test("rawChild() returns a url with the given path suffixes added, without escaping", function(t){
    var url = "http://asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).rawChild('kid here', 'and here').toString(),
      'http://asdf.com/path/kid here/and here'
    );
    t.end();
  });
  test("rawChild() returns the last item in the path if there is no input", function(t){
    var url = "http://asdf.com/path/kid?asdf=1234#frag";
    t.equal(
      urlgrey(url).rawChild(),
      'kid'
    );
    t.end();
  });
  test("rawChild() ignores a trailing slash", function(t){
    var url = "http://asdf.com/path/kid/?asdf=1234#frag";
    t.equal(
      urlgrey(url).rawChild(),
      'kid'
    );
    t.end();
  });

  test("child() returns a url with the given path suffix added", function(t){
    var url = "http://asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).child('kid here').toString(),
      'http://asdf.com/path/kid%20here'
    );
    t.end();
  });
  test("child() returns a url with the given path suffixes added", function(t){
    var url = "http://asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).child('kid here', 'and here').toString(),
      'http://asdf.com/path/kid%20here/and%20here'
    );
    t.end();
  });
  test("child() returns a url with the given path suffix added even if it's 0", function(t){
    var url = "http://asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).child(0).toString(),
      'http://asdf.com/path/0'
    );
    t.end();
  });
  test("child() returns the last item in the path if there is no input", function(t){
    var url = "http://asdf.com/path/kid?asdf=1234#frag";
    t.equal(
      urlgrey(url).child(),
      'kid'
    );
    t.end();
  });
  test("child() ignores a trailing slash", function(t){
    var url = "http://asdf.com/path/kid/?asdf=1234#frag";
    t.equal(
      urlgrey(url).child(),
      'kid'
    );
    t.end();
  });
  test("parsed() returns some stuff", function(t){
    var url = "http://gdizzle:pazz@asdf.com:5678/path/kid/?asdf=1234#frag";
    var actual = urlgrey(url).parsed();
    var expected = {
      "protocol": "http",
      "auth": "gdizzle:pazz",
      "host": "asdf.com:5678",
      "port": 5678,
      "hostname": "asdf.com",
      "hash": "frag",
      "search": "?asdf=1234",
      "query": "asdf=1234",
      "pathname": "/path/kid/",
      "path": "/path/kid/?asdf=1234",
      "href": "http://gdizzle:pazz@asdf.com:5678/path/kid/?asdf=1234#frag",
      "username": "gdizzle",
      "password": "pazz"
    };
    t.deepLooseEqual(
      actual, expected
    );
    t.end();
  });
  test("toString() returns the input string if unmodified", function(t){
    var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).toString(),
      url
    );
    t.end();
  });
  test("toString() returns an absolute uri even if one is not given", function(t){
    var url = "/path?asdf=1234#frag";
    t.ok(
      /^http:\/\/|file:\/\//.test(urlgrey(url).toString())
    );
    t.end();
  });

  test("protocol() gets the protocol", function(t){
    var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).protocol(),
      'https'
    );
    t.end();
  });

  if (isBrowser){
    test("protocol() gets the protocol as the current one if unset", function(t){
      t.equal(
        urlgrey('').protocol(),
        window.location.href.slice(0, 4)
      );
      t.end();
    });
  } else {
    test("protocol() gets the protocol as http if unset", function(t){
      var url = "/path?asdf=1234#frag";
      t.equal(
        urlgrey(url).protocol(),
        'http'
      );
      t.end();
    });
  }

  test("protocol() sets the protocol", function(t){
    var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
    var expected = "http://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
    t.equal(
      urlgrey(url).protocol('http').toString(),
      expected
    );
    t.end();
  });

  test("queryString() sets the queryString", function(t){
    t.equal(
    urlgrey("http://s.asdf.com").queryString('asdf=1234').toString(),
    "http://s.asdf.com?asdf=1234"
    );
    t.end();
  });
  test("queryString() updates the queryString", function(t){
    t.equal(
    urlgrey("http://s.asdf.com?asdf=1234").queryString('qwer=1235').toString(),
    "http://s.asdf.com?qwer=1235"
    );
    t.end();
  });
  test("queryString() gets the queryString", function(t){
    t.equal(
      urlgrey("http://s.asdf.com/?qwer=1234").queryString(),
      "qwer=1234"
    );
    t.end();
  });
  test("queryString() 'roundtrips' the queryString", function(t){
    t.equal(
      urlgrey("http://s.asdf.com/?qwer=1234")
        .queryString('asdf=1234').queryString(),
      "asdf=1234"
    );
    t.end();
  });

  test("rawQuery() adds a querystring", function(t){
    t.equal(
      urlgrey("http://asdf.com").rawQuery({asdf:'12 34'}).toString(),
      "http://asdf.com?asdf=12 34"
    );
    t.end();
  });
  test("rawQuery() modifies a querystring", function(t){
    t.equal(
      urlgrey("http://asdf.com?asdf=5678&b=2").rawQuery({asdf:'12 34'}).toString(),
      "http://asdf.com?asdf=12 34&b=2"
    );
    t.end();
  });
  test("rawQuery() clears a querystring", function(t){
    t.equal(
      urlgrey("http://asdf.com?asdf=5678").rawQuery(false) .toString(),
      "http://asdf.com"
    );
    t.end();
  });
  test("rawQuery() extracts a querystring as an object", function(t){
    t.looseEqual(
      urlgrey("http://asdf.com?asdf=56%2078").rawQuery(),
      {asdf:'56 78'}
    );
    t.end();
  });
  test("query() adds a querystring", function(t){
    t.equal(
      urlgrey("http://asdf.com").query({asdf:'12 34'}) .toString(),
      "http://asdf.com?asdf=12%2034"
    );
    t.end();
  });
  test("query() modifies a querystring", function(t){
    t.equal(
      urlgrey("http://asdf.com?asdf=5678&b=2").query({asdf:1234}).toString(),
      "http://asdf.com?asdf=1234&b=2"
    );
    t.end();
  });
  test("query() clears a querystring", function(t){
    t.equal(
      urlgrey("http://asdf.com?asdf=5678").query(false).toString(),
      "http://asdf.com"
    );
    t.end();
  });
  test("query() extracts a querystring as an object", function(t){
    t.looseEqual(
      urlgrey("http://asdf.com?asdf=56%2078").query(),
      {asdf:'56 78'}
    );
    t.end();
  });
  test("encode() returns a url-encoded version of its input string", function(t){
    t.equal(
      urlgrey('').encode("this is a test"),
      "this%20is%20a%20test"
    );
    t.end();
  });
  test("decode() returns a url-decoded version of its input string", function(t){
    t.equal(
      urlgrey('').decode("this%20is%20a%20test"),
      "this is a test"
    );
    t.end();
  });
};

module.exports = tapetest;
