var test = require('tape');
var traverse = require('../');

test('traverse an Error', function (t) {
    var obj = new Error("test");
    var results = traverse(obj).map(function (node) {});
    t.same(results, { message: 'test' });
    
    t.end();
});

