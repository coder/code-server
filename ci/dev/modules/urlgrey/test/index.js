var isBrowser = !(typeof module !== 'undefined' && module.exports);
if (!isBrowser) {
  // non-browser code
  var chai = require('chai');
  chai.should();
  var urlgrey = require('../index');
}
var assert = chai.assert;

describe("urlgrey", function () {
  describe("chainability", function () {
    it("doesn't over-write the original url", function () {
      var urlStr = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
      var url = urlgrey(urlStr);
      url.hostname('asdf.com')
        .toString().should.equal("https://user:pass@asdf.com/path?asdf=1234#frag");
      url.port(8080);
      url.protocol('http');
      url.username('http');
      url.password('http');
      url.path('http');
      url.hash('http');
      url.queryString('http=1234');
      url.query(false);
      url.extendedPath("/asdf?qwer=asdf#swqertwert23");
      url.toString().should.equal(urlStr); // original object is unmodified
    });
  });
  describe("#toJSON", function () {
    it("returns the same thing as toString", function () {
      var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
      urlgrey(url).toJSON().should.equal(urlgrey(url).toString());
    });
  });
  describe("#hostname", function () {
    it("gets the hostname", function () {
      var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
      urlgrey(url).hostname().should.equal('subdomain.asdf.com');
    });
    if (isBrowser) {
      it("gets the hostname even if unset", function () {
        var url = "/path?asdf=1234#frag";
        var u = urlgrey(url);
        if (u.protocol() === 'file') {
          // chrome uses localhost.  other browsers don't
          chai.expect((u.hostname() === '') || (u.hostname() === 'localhost')).to.eql(true);
        } else {
          chai.expect(u.hostname()).to.equal(window.location.hostname + '');
        }
      });
    }
    it("sets the hostname", function () {
      var url = "http://subdomain.asdf.com";
      urlgrey(url).hostname("blah")
        .toString().should.equal('http://blah');
    });
  });
  describe("#port", function () {
    it("gets the port", function () {
      var url = "https://user:pass@subdomain.asdf.com:9090";
      urlgrey(url).port().should.equal(9090);
    });
    it("gets a correct default port when it's missing", function () {
      var url = "https://user:pass@subdomain.asdf.com";
      urlgrey(url).port().should.equal(443);
    });
    it("omits the port when it's 80", function () {
      var url = "http://subdomain.asdf.com:9090";
      urlgrey(url).port(80)
        .toString().should.equal('http://subdomain.asdf.com');
    });
    it("sets the port", function () {
      var url = "https://subdomain.asdf.com";
      urlgrey(url).port(9090)
        .toString().should.equal('https://subdomain.asdf.com:9090');
    });
  });
  describe("#rawPath", function () {
    it("gets the path", function () {
      var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
      urlgrey(url).rawPath().should.equal('/path');
    });
    it("sets the path", function () {
      var url = "https://subdomain.asdf.com";
      urlgrey(url).rawPath("blah")
        .toString().should.equal('https://subdomain.asdf.com/blah');
    });
    it("does not encode pieces of the path", function () {
      var url = "https://subdomain.asdf.com";
      urlgrey(url).rawPath("not encode here", "and/not/here")
        .toString().should.equal('https://subdomain.asdf.com/not encode here/and/not/here');
    });
    it("sets the path from strings and arrays of strings", function () {
      var url = "https://asdf.com";
      urlgrey(url).rawPath(['qwer', '/asdf'], 'qwer/1234/', '/1234/')
        .toString().should.equal('https://asdf.com/qwer/asdf/qwer/1234/1234');
    });
  });
  describe("#path", function () {
    it("gets the path", function () {
      var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
      urlgrey(url).path().should.equal('/path');
    });
    it("sets the path", function () {
      var url = "https://subdomain.asdf.com";
      urlgrey(url).path("blah")
        .toString().should.equal('https://subdomain.asdf.com/blah');
    });
    it("url encodes pieces of the path, but not slashes", function () {
      var url = "https://subdomain.asdf.com";
      urlgrey(url).path("encode here", "but/not/here")
        .toString().should.equal('https://subdomain.asdf.com/encode%20here/but/not/here');
    });
    it("sets the path from strings and arrays of strings", function () {
      var url = "https://asdf.com";
      urlgrey(url).path(['qwer', '/asdf'], 'qwer/1234/', '/1234/')
        .toString().should.equal('https://asdf.com/qwer/asdf/qwer/1234/1234');
    });
  });
  describe("#hash", function () {
    it("gets the hash", function () {
      var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
      urlgrey(url).hash().should.equal('frag');
    });
    it("sets the hash", function () {
      var url = "https://subdomain.asdf.com";
      urlgrey(url).hash("blah")
        .toString().should.equal('https://subdomain.asdf.com#blah');
    });
  });
  describe("#password", function () {
    it("gets the password", function () {
      var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
      urlgrey(url).password().should.equal('pass');
    });
    it("sets the password", function () {
      var url = "https://user:pass@subdomain.asdf.com";
      urlgrey(url).password("blah")
        .toString().should.equal('https://user:blah@subdomain.asdf.com');
    });
  });
  describe("#username", function () {
    it("gets the username", function () {
      var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
      urlgrey(url).username().should.equal('user');
    });
    it("sets the username", function () {
      var url = "https://user:pass@subdomain.asdf.com";
      urlgrey(url).username("blah")
        .toString().should.equal('https://blah:pass@subdomain.asdf.com');
    });
  });
  describe("#parent", function () {
    it("returns the second-last item in the path if there is no input", function () {
      var url = "http://asdf.com/path/kid?asdf=1234#frag";
      urlgrey(url).parent()
        .toString().should.equal('http://asdf.com/path');
    });
    it("ignores a trailing slash", function () {
      var url = "http://asdf.com/path/kid/?asdf=1234#frag";
      urlgrey(url).parent()
        .toString().should.equal('http://asdf.com/path');
    });
    it("throws an exception when no parent path exists", function () {
      var url = "http://asdf.com/";
      try {
        urlgrey(url).parent();
        should.fail("expected exception was not raised.");
      } catch (ex) {
        ex.message.should.equal('The current path has no parent path');
      }
    });
  });
  describe("#extendedPath", function () {
    it("returns the part of the url after the host:port", function () {
      var url = "http://asdf.com:8080/path?asdf=1234#frag";
      urlgrey(url).extendedPath().should.equal('/path?asdf=1234#frag');
    });
    it("lets you set the part of the url after the host:port", function () {
      var url = "http://asdf.com:8080/path?asdf=1234#frag";
      urlgrey(url).extendedPath('/asdf?qwer=1234#fraggle').toString()
        .should.equal('http://asdf.com:8080/asdf?qwer=1234#fraggle');
    });
  });
  describe("#rawChild", function () {
    it("returns a url with the given path suffix added", function () {
      var url = "http://asdf.com/path?asdf=1234#frag";
      urlgrey(url).rawChild('{kid here}')
        .toString().should.equal('http://asdf.com/path/{kid here}');
    });
    it("returns a url with the given path suffixes added, without escaping", function () {
      var url = "http://asdf.com/path?asdf=1234#frag";
      urlgrey(url).rawChild('{kid here}', '{and here}')
        .toString().should.equal('http://asdf.com/path/{kid here}/{and here}');
    });
    it("returns the last item in the path if there is no input", function () {
      var url = "http://asdf.com/path/kid?asdf=1234#frag";
      urlgrey(url).rawChild().should.equal('kid');
    });
    it("ignores a trailing slash", function () {
      var url = "http://asdf.com/path/kid/?asdf=1234#frag";
      urlgrey(url).rawChild().should.equal('kid');
    });
  });
  describe("#child", function () {
    it("returns a url with the given path suffix added", function () {
      var url = "http://asdf.com/path?asdf=1234#frag";
      urlgrey(url).child('kid here')
        .toString().should.equal('http://asdf.com/path/kid%20here');
    });
    it("returns a url with the given path suffixes added", function () {
      var url = "http://asdf.com/path?asdf=1234#frag";
      urlgrey(url).child('kid here', 'and here')
        .toString().should.equal('http://asdf.com/path/kid%20here/and%20here');
    });
    it("returns a url with the given path suffix added even if it's 0", function () {
      var url = "http://asdf.com/path?asdf=1234#frag";
      urlgrey(url).child(0)
        .toString().should.equal('http://asdf.com/path/0');
    });
    it("returns the last item in the path if there is no input", function () {
      var url = "http://asdf.com/path/kid?asdf=1234#frag";
      urlgrey(url).child().should.equal('kid');
    });
    it("ignores a trailing slash", function () {
      var url = "http://asdf.com/path/kid/?asdf=1234#frag";
      urlgrey(url).child().should.equal('kid');
    });
    it("url-decodes the child if it's encoded", function () {
      var url = "http://asdf.com/path/the%20kid";
      urlgrey(url).child().should.equal('the kid');
    });
    it("url-encodes the child if necessary", function () {
      var url = "http://asdf.com/path/";
      urlgrey(url).child('the kid').toString().should.equal('http://asdf.com/path/the%20kid');
    });
  });
  describe("#parsed", function () {
    it("returns some stuff", function () {
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
      chai.expect(actual).to.eql(expected);
    });
  });

  describe("#toString", function () {
    it("returns the input string if unmodified", function () {
      var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
      urlgrey(url).toString().should.equal(url);
    });
    it("returns an absolute uri even if one is not given", function () {
      var url = "/path?asdf=1234#frag";
      urlgrey(url).toString()
        .should.match(/^http:\/\/|file:\/\//);
    });
  });
  describe("#protocol", function () {
    it("gets the protocol", function () {
      var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
      urlgrey(url).protocol().should.equal('https');
    });

    if (isBrowser) {
      it("gets the protocol as the current one if unset", function () {
        urlgrey('').protocol()
          .should.equal(window.location.href.slice(0, 4));
      });
    } else {
      it("gets the protocol as http if unset", function () {
        var url = "/path?asdf=1234#frag";
        urlgrey(url).protocol().should.equal('http');
      });
    }

    it("sets the protocol", function () {
      var url = "https://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
      var expected = "http://user:pass@subdomain.asdf.com/path?asdf=1234#frag";
      urlgrey(url).protocol('http').toString().should.equal(expected);
    });
  });

  describe("#queryString", function () {
    it("sets the queryString", function () {
      var updated = urlgrey("http://s.asdf.com").queryString('foo=1234');

      updated.toString().should.equal("http://s.asdf.com?foo=1234");
      var query = updated.query();
      assert.deepEqual(query, { foo: "1234" });
    });
    it("changes the queryString", function () {
      var updated = urlgrey("http://s.asdf.com?foo=1234&bar=5678").queryString('baz=3456');

      updated.toString().should.equal("http://s.asdf.com?baz=3456");
      assert.deepEqual(updated.query(), { baz: "3456" });
    });
    it("gets the queryString", function () {
      chai.expect(
        urlgrey("http://s.asdf.com/?qwer=1234").queryString()
      ).to.equal("qwer=1234");
    });
    it("'roundtrips' the queryString", function () {
      urlgrey("http://s.asdf.com/?qwer=1234").queryString('asdf=1234')
        .queryString().should.equal("asdf=1234");
    });

  });
  describe("#rawQuery", function () {
    it("adds a querystring", function () {
      var updated = urlgrey("http://asdf.com").rawQuery({ foo: '12 34' });

      updated.toString().should.equal("http://asdf.com?foo=12 34");
      assert.deepEqual(updated.rawQuery(), { foo: "12 34" });
    });
    it("appends a querystring", function () {
      var updated = urlgrey("http://asdf.com?foo=1234").rawQuery({ bar: '56 78' });

      updated.toString().should.equal("http://asdf.com?foo=1234&bar=56 78");
      assert.deepEqual(updated.rawQuery(), { foo: "1234", bar: "56 78" });
    });
    it("modifies a querystring", function () {
      var updated = urlgrey("http://asdf.com?foo=1234&bar=abcd").rawQuery({ foo: "56 78" });

      updated.toString().should.equal("http://asdf.com?foo=56 78&bar=abcd");
      assert.deepEqual(updated.rawQuery(), { foo: "56 78", bar: "abcd" });
    });
    it("clears a querystring", function () {
      var updated = urlgrey("http://asdf.com?foo=1234").rawQuery(false);

      updated.toString().should.equal("http://asdf.com");
      updated.rawQuery().should.deep.equal({});
    });
    it("clears an element of a querystring with null or false", function () {
      var updated = urlgrey("http://asdf.com")
        .rawQuery({ foo: 1, bar: 2, baz: 3 })
        .rawQuery({ foo: 0, bar: null });

      updated.toString().should.equal("http://asdf.com?foo=0&baz=3");
      assert.deepEqual(updated.rawQuery(), { foo: "0", baz: "3" });
    });
    it("extracts a querystring as an object", function () {
      var queryObject = urlgrey("http://asdf.com?asdf=56%2078").rawQuery();
      assert.deepEqual(queryObject, { asdf: '56%2078' });
    });
  });
  describe("#query", function () {
    it("adds a querystring", function () {
      var updated = urlgrey("http://asdf.com").query({ foo: '12 34' });

      updated.toString().should.equal("http://asdf.com?foo=12%2034");
      assert.deepEqual(updated.query(), { foo: "12 34" });
    });
    it("appends a querystring", function () {
      var updated = urlgrey("http://asdf.com?foo=1234").query({ bar: '56 78' });

      updated.toString().should.equal("http://asdf.com?foo=1234&bar=56%2078");
      assert.deepEqual(updated.query(), { foo: "1234", bar: "56 78" });
    });
    it("modifies a querystring", function () {
      var updated = urlgrey("http://asdf.com?foo=1234&bar=abcd").query({ foo: "56 78" });

      updated.toString().should.equal("http://asdf.com?foo=56%2078&bar=abcd");
      assert.deepEqual(updated.query(), { foo: "56 78", bar: "abcd" });

    });
    it("clears a querystring", function () {
      var updated = urlgrey("http://asdf.com?foo=1234").query(false);

      updated.toString().should.equal("http://asdf.com");
      assert.deepEqual(updated.query(), {});
    });
    it("clears an element of a querystring with null or false", function () {
      var updated = urlgrey("http://asdf.com")
        .rawQuery({ foo: 1, bar: 2, baz: 3 })
        .rawQuery({ foo: 0, bar: null });

      updated.toString().should.equal("http://asdf.com?foo=0&baz=3");
      assert.deepEqual(updated.query(), { foo: "0", baz: "3" });
    });
    it("extracts a querystring as an object", function () {
      assert.deepEqual(urlgrey("http://asdf.com?asdf=56%2078").query(), { asdf: '56 78' });
    });
  });
  describe('#encode', function () {
    it("returns a url-encoded version of its input string", function () {
      urlgrey('').encode("this is a test").should.equal("this%20is%20a%20test");
    });
  });
  describe('#decode', function () {
    it("returns a url-decoded version of its input string", function () {
      urlgrey('').decode("this%20is%20a%20test").should.equal("this is a test");
    });
  });

});
