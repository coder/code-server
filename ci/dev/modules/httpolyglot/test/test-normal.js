var fs = require('fs');
var http = require('http');
var https = require('https');
var assert = require('assert');

var common = require(__dirname + '/common');
var httpolyglot = require(__dirname + '/../lib/index');

var srv = httpolyglot.createServer({
  key: fs.readFileSync(__dirname + '/fixtures/server.key'),
  cert: fs.readFileSync(__dirname + '/fixtures/server.crt')
}, common.mustCall(function(req, res) {
  this.count || (this.count = 0);
  res.end(req.socket.encrypted ? 'https' : 'http');
  if (++this.count === 2)
    this.close();
}, 2));
srv.listen(0, '127.0.0.1', common.mustCall(function() {
  var port = this.address().port;

  http.get({
    host: '127.0.0.1',
    port: port
  }, common.mustCall(function(res) {
    var body = '';
    res.on('data', function(data) {
      body += data;
    }).on('end', common.mustCall(function() {
      assert.strictEqual(body, 'http');
    }));
  }));

  https.get({
    host: '127.0.0.1',
    port: port,
    rejectUnauthorized: false
  }, common.mustCall(function(res) {
    var body = '';
    res.on('data', function(data) {
      body += data;
    }).on('end', common.mustCall(function() {
      assert.strictEqual(body, 'https');
    }));
  }));
}));
