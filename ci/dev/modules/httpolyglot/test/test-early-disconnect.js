var fs = require('fs');
var exec = require('child_process').exec;
var assert = require('assert');

var common = require(__dirname + '/common');
var httpolyglot = require(__dirname + '/../lib/index');

var srv = httpolyglot.createServer({
  key: fs.readFileSync(__dirname + '/fixtures/server.key'),
  cert: fs.readFileSync(__dirname + '/fixtures/server.crt')
}, function(req, res) {
  assert(false, 'Request handler should not be called');
});
srv.listen(0, '127.0.0.1', common.mustCall(function() {
  var port = this.address().port;

  exec('nmap 127.0.0.1 -p' + port,
       common.mustCall(function(err, stdout, stderr) {
    srv.close();
  }));
}));
