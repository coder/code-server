var bench = require('nanobench');
var path = require('path');
var fs = require('fs');
var insert = require('../');

bench('jquery', function (b) {
    var source = fs.readFileSync(path.join(__dirname, 'jquery-3.3.1.js'));
    b.start();
    var stream = insert();
    stream.on('data', function() {});
    stream.on('end', function () {
        b.end();
    });
    stream.end(source);
});
