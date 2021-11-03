var test = require('tape');
var mdeps = require('module-deps');
var bpack = require('browser-pack');
var insert = require('../');
var concat = require('concat-stream');
var vm = require('vm');
// use is-buffer instead of builtin Buffer.isBuffer. The builtin
// does `instanceof` which does not work on the browserified version
var isBuffer = require('is-buffer');

test('isbuffer', function (t) {
    t.plan(5);
    var deps = mdeps()
    var pack = bpack({ raw: true, hasExports: true });
    deps.pipe(pack).pipe(concat(function (src) {
        var c = { global: {} };
        vm.runInNewContext(src, c);
        t.equal(c.require('main')(Buffer('wow')), true, 'is a buffer');
        t.equal(c.require('main')('wow'), false, 'not a buffer (string)');
        t.equal(c.require('main')({}), false, 'not a buffer (object)');
        t.notOk(/require\("buffer"\)/.test(src), 'buffer not required in source')
        t.notOk(/require\("\//.test(src), 'absolute path not required in source')
    }));
    deps.write({ transform: inserter, global: true });
    deps.end({ id: 'main', file: __dirname + '/isbuffer/main.js' });
});

test('isbuffer (and Buffer.from)', function (t) {
    t.plan(5);
    var deps = mdeps()
    var pack = bpack({ raw: true, hasExports: true });
    deps.pipe(pack).pipe(concat(function (src) {
        var c = { global: {} };
        vm.runInNewContext(src, c);
        t.equal(c.require('main')(c.require('main').a()), true, 'is a buffer');
        t.equal(c.require('main')('wow'), false, 'is not a buffer');
        t.equal(isBuffer(c.require('main').a()), true, 'is a buffer');
        t.ok(/require\("buffer"\)/.test(src), 'buffer required in source')
        t.equal(c.require('main').a().toString('hex'), 'abcd', 'is a buffer');
    }));
    deps.write({ transform: inserter, global: true });
    deps.end({ id: 'main', file: __dirname + '/isbuffer/both.js' });
});

test('isbuffer (and new Buffer)', function (t) {
    t.plan(5);
    var deps = mdeps()
    var pack = bpack({ raw: true, hasExports: true });
    deps.pipe(pack).pipe(concat(function (src) {
        var c = { global: {} };
        vm.runInNewContext(src, c);
        t.equal(c.require('main')(c.require('main').a()), true, 'is a buffer');
        t.equal(c.require('main')('wow'), false, 'is not a buffer');
        t.equal(isBuffer(c.require('main').a()), true, 'is a buffer');
        t.ok(/require\("buffer"\)/.test(src), 'buffer required in source')
        t.equal(c.require('main').a().toString('utf8'), 'abcd', 'is a buffer');
    }));
    deps.write({ transform: inserter, global: true });
    deps.end({ id: 'main', file: __dirname + '/isbuffer/new.js' });
});

function inserter (file) {
    return insert(file, { basedir: __dirname + '/isbuffer' });
}
