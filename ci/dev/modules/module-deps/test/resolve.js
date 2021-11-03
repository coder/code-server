var fs = require('fs');
var path = require('path');

var mdeps = require('../');
var test = require('tap').test;
var nodeResolve = require('resolve');
var browserResolve = require('browser-resolve');

var missing = path.join(__dirname, '/missing');

var files = {
    foo: path.join(__dirname, '/files/resolve/foo/foo.js'),
    bar: path.join(__dirname, '/files/resolve/bar/bar.js'),
    bar2: path.join(__dirname, '/files/resolve/bar/bar2.js'),
    baz: path.join(__dirname, '/files/resolve/foo/baz/baz.js')
};

var sources = Object.keys(files)
    .reduce(function (acc, file) {
        acc[file] = fs.readFileSync(files[file], 'utf8');
        return acc;
    }, {});

var expectedRows = [
    {
        "deps": {},
        "file": files.baz,
        "id": files.baz,
        "source": sources.baz
    },
    {
        "deps": {},
        "file": files.bar2,
        "id": files.bar2,
        "source": sources.bar2
    },
    {
        "deps": {
            "./bar2": files.bar2
        },
        "file": files.bar,
        "id": files.bar,
        "source": sources.bar
    },
    {
        "deps": {
            "../bar/bar.js": files.bar,
            "./baz/baz.js": files.baz
        },
        "entry": true,
        "file": files.foo,
        "id": "foo",
        "source": sources.foo
    }
];

test('browser resolve - missing', function (t) {
    t.plan(1);
    var d = mdeps({resolve: browserResolve});

    d.end({id: 'missing', file: missing, entry: true});

    d.on('end', function () {
        t.fail('errored');
    });
    d.on('error', function (err) {
        t.match(
            String(err),
            /Cannot find module .*/
        );
    });
});

test('node resolve - missing', function (t) {
    t.plan(1);
    var d = mdeps({resolve: nodeResolve});

    d.end({id: 'missing', file: missing, entry: true});

    d.on('end', function () {
        t.fail('errored');
    });
    d.on('error', function (err) {
        t.match(
            String(err),
            /Cannot find module .*/
        );
    });
});

test('browser resolve', function (t) {
    t.plan(1);
    var d = mdeps({resolve: browserResolve});

    d.end({id: 'foo', file: files.foo, entry: true});

    var rows = [];
    d.on('data', function (row) {rows.push(row)});
    d.on('end', function () {
        t.same(rows, expectedRows);
    });
    d.on('error', function () {
        t.fail('errored');
    });
});

test('node resolve', function (t) {
    t.plan(1);
    var d = mdeps({resolve: nodeResolve});

    d.end({id: 'foo', file: files.foo, entry: true});

    var rows = [];
    d.on('data', function (row) {rows.push(row)});
    d.on('end', function () {
        t.same(rows, expectedRows);
    });
    d.on('error', function () {
        t.fail('errored');
    });
});