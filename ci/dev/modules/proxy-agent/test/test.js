
/**
 * Module dependencies.
 */

var fs = require('fs');
var url = require('url');
var http = require('http');
var https = require('https');
var assert = require('assert');
var toBuffer = require('stream-to-buffer');
var Proxy = require('proxy');
var socks = require('socksv5');
var ProxyAgent = require('../');

describe('ProxyAgent', function () {
  // target servers
  var httpServer, httpPort;
  var httpsServer, httpsPort;

  // proxy servers
  var socksServer, socksPort;
  var proxyServer, proxyPort;
  var proxyHttpsServer, proxyHttpsPort;

  before(function (done) {
    // setup target HTTP server
    httpServer = http.createServer();
    httpServer.listen(function () {
      httpPort = httpServer.address().port;
      done();
    });
  });

  before(function (done) {
    // setup target SSL HTTPS server
    var options = {
      key: fs.readFileSync(__dirname + '/ssl-cert-snakeoil.key'),
      cert: fs.readFileSync(__dirname + '/ssl-cert-snakeoil.pem')
    };
    httpsServer = https.createServer(options);
    httpsServer.listen(function () {
      httpsPort = httpsServer.address().port;
      done();
    });
  });

  before(function (done) {
    // setup SOCKS proxy server
    socksServer = socks.createServer(function(info, accept, deny) {
      accept();
    });
    socksServer.listen(function() {
      socksPort = socksServer.address().port;
      done();
    });
    socksServer.useAuth(socks.auth.None());
  });

  before(function (done) {
    // setup HTTP proxy server
    proxyServer = Proxy();
    proxyServer.listen(function () {
      proxyPort = proxyServer.address().port;
      done();
    });
  });

  before(function (done) {
    // setup SSL HTTPS proxy server
    var options = {
      key: fs.readFileSync(__dirname + '/ssl-cert-snakeoil.key'),
      cert: fs.readFileSync(__dirname + '/ssl-cert-snakeoil.pem')
    };
    proxyHttpsServer = Proxy(https.createServer(options));
    proxyHttpsServer.listen(function () {
      proxyHttpsPort = proxyHttpsServer.address().port;
      done();
    });
  });


  after(function (done) {
    //socksServer.once('close', function () { done(); });
    socksServer.close();
    done();
  });

  after(function (done) {
    //httpServer.once('close', function () { done(); });
    httpServer.close();
    done();
  });

  after(function (done) {
    //httpsServer.once('close', function () { done(); });
    httpsServer.close();
    done();
  });

  after(function (done) {
    //proxyServer.once('close', function () { done(); });
    proxyServer.close();
    done();
  });

  after(function (done) {
    //proxyHttpsServer.once('close', function () { done(); });
    proxyHttpsServer.close();
    done();
  });

  it('should export a "function"', function () {
    assert.equal('function', typeof ProxyAgent);
  });

  describe('constructor', function () {
    it('should throw a TypeError if no "protocol" is given', function () {
      assert.throws(function () {
        ProxyAgent({ host: 'foo.com', port: 3128 });
      }, function (e) {
        return 'TypeError' === e.name &&
          /must specify a "protocol"/.test(e.message) &&
          /\bhttp\b/.test(e.message) &&
          /\bhttps\b/.test(e.message) &&
          /\bsocks\b/.test(e.message);
      });
    });

    it('should throw a TypeError for unsupported proxy protocols', function () {
      assert.throws(function () {
        ProxyAgent('bad://foo.com:8888');
      }, function (e) {
        return 'TypeError' === e.name &&
          /unsupported proxy protocol/.test(e.message);
      });
    });
  });

  describe('"http" module', function () {
    describe('over "http" proxy', function () {
      it('should work', function (done) {
        httpServer.once('request', function (req, res) {
          res.end(JSON.stringify(req.headers));
        });

        var uri = 'http://localhost:' + proxyPort;
        var agent = new ProxyAgent(uri);

        var opts = url.parse('http://localhost:' + httpPort + '/test');
        opts.agent = agent;

        var req = http.get(opts, function (res) {
          toBuffer(res, function (err, buf) {
            if (err) return done(err);
            var data = JSON.parse(buf.toString('utf8'));
            assert.equal('localhost:' + httpPort, data.host);
            assert('via' in data);
            done();
          });
        });
        req.once('error', done);
      });
    });

    describe('over "http" proxy from env', function () {
      it('should work', function (done) {
        httpServer.once('request', function (req, res) {
          res.end(JSON.stringify(req.headers));
        });

        process.env.HTTP_PROXY = 'http://localhost:' + proxyPort;
        var agent = new ProxyAgent();

        var opts = url.parse('http://localhost:' + httpPort + '/test');
        opts.agent = agent;

        var req = http.get(opts, function (res) {
          toBuffer(res, function (err, buf) {
            if (err) return done(err);
            var data = JSON.parse(buf.toString('utf8'));
            assert.equal('localhost:' + httpPort, data.host);
            assert('via' in data);
            done();
          });
        });
        req.once('error', done);
      });
    });

    describe('with no proxy from env', function () {
      it('should work', function (done) {
        httpServer.once('request', function (req, res) {
          res.end(JSON.stringify(req.headers));
        });

        process.env.NO_PROXY = '*';
        var agent = new ProxyAgent();

        var opts = url.parse('http://localhost:' + httpPort + '/test');
        opts.agent = agent;

        var req = http.get(opts, function (res) {
          toBuffer(res, function (err, buf) {
            if (err) return done(err);
            var data = JSON.parse(buf.toString('utf8'));
            assert.equal('localhost:' + httpPort, data.host);
            assert(!('via' in data));
            done();
          });
        });
        req.once('error', done);
      });
    });

    describe('over "https" proxy', function () {
      it('should work', function (done) {
        httpServer.once('request', function (req, res) {
          res.end(JSON.stringify(req.headers));
        });

        var uri = 'https://localhost:' + proxyHttpsPort;
        var proxy = url.parse(uri);
        proxy.rejectUnauthorized = false;
        var agent = new ProxyAgent(proxy);

        var opts = url.parse('http://localhost:' + httpPort + '/test');
        opts.agent = agent;

        var req = http.get(opts, function (res) {
          toBuffer(res, function (err, buf) {
            if (err) return done(err);
            var data = JSON.parse(buf.toString('utf8'));
            assert.equal('localhost:' + httpPort, data.host);
            assert('via' in data);
            done();
          });
        });
        req.once('error', done);
      });
    });

    describe('over "socks" proxy', function () {
      it('should work', function (done) {
        httpServer.once('request', function (req, res) {
          res.end(JSON.stringify(req.headers));
        });

        var uri = 'socks://localhost:' + socksPort;
        var agent = new ProxyAgent(uri);

        var opts = url.parse('http://localhost:' + httpPort + '/test');
        opts.agent = agent;

        var req = http.get(opts, function (res) {
          toBuffer(res, function (err, buf) {
            if (err) return done(err);
            var data = JSON.parse(buf.toString('utf8'));
            assert.equal('localhost:' + httpPort, data.host);
            done();
          });
        });
        req.once('error', done);
      });
    });
  });

  describe('"https" module', function () {
    describe('over "http" proxy', function () {
      it('should work', function (done) {
        httpsServer.once('request', function (req, res) {
          res.end(JSON.stringify(req.headers));
        });

        var uri = 'http://localhost:' + proxyPort;
        var agent = new ProxyAgent(uri);

        var opts = url.parse('https://localhost:' + httpsPort + '/test');
        opts.agent = agent;
        opts.rejectUnauthorized = false;

        var req = https.get(opts, function (res) {
          toBuffer(res, function (err, buf) {
            if (err) return done(err);
            var data = JSON.parse(buf.toString('utf8'));
            assert.equal('localhost:' + httpsPort, data.host);
            done();
          });
        });
        req.once('error', done);
      });
    });

    describe('over "https" proxy', function () {
      it('should work', function (done) {
        var gotReq = false;
        httpsServer.once('request', function (req, res) {
          gotReq = true;
          res.end(JSON.stringify(req.headers));
        });

        var agent = new ProxyAgent({
          protocol: 'https:',
          host: 'localhost',
          port: proxyHttpsPort,
          rejectUnauthorized: false
        });

        var opts = url.parse('https://localhost:' + httpsPort + '/test');
        opts.agent = agent;
        opts.rejectUnauthorized = false;

        var req = https.get(opts, function (res) {
          toBuffer(res, function (err, buf) {
            if (err) return done(err);
            var data = JSON.parse(buf.toString('utf8'));
            assert.equal('localhost:' + httpsPort, data.host);
            assert(gotReq);
            done();
          });
        });
        req.once('error', done);
      });
    });

    describe('over "socks" proxy', function () {
      it('should work', function (done) {
        var gotReq = false;
        httpsServer.once('request', function (req, res) {
          gotReq = true;
          res.end(JSON.stringify(req.headers));
        });

        var uri = 'socks://localhost:' + socksPort;
        var agent = new ProxyAgent(uri);

        var opts = url.parse('https://localhost:' + httpsPort + '/test');
        opts.agent = agent;
        opts.rejectUnauthorized = false;

        var req = https.get(opts, function (res) {
          toBuffer(res, function (err, buf) {
            if (err) return done(err);
            var data = JSON.parse(buf.toString('utf8'));
            assert.equal('localhost:' + httpsPort, data.host);
            assert(gotReq);
            done();
          });
        });
        req.once('error', done);
      });
    });
  });
});
