var splicer = require('../');
var through = require('through2');
var deps = require('module-deps');
var pack = require('browser-pack');

var pipeline = splicer.obj([
    'deps', [ deps() ],
    'pack', [ pack({ raw: true }) ]
]);

pipeline.get('deps').push(through.obj(function (row, enc, next) {
    row.source = row.source.toUpperCase();
    this.push(row);
    next();
}));

pipeline.pipe(process.stdout);

pipeline.end(__dirname + '/browser/main.js');
