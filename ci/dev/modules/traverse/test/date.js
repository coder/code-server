var test = require('tape');
var traverse = require('../');

test('dateEach', function (t) {
    var obj = { x : new Date, y : 10, z : 5 };
    
    var counts = {};
    
    traverse(obj).forEach(function (node) {
        var t = (node instanceof Date && 'Date') || typeof node;
        counts[t] = (counts[t] || 0) + 1;
    });
    
    t.same(counts, {
        object : 1,
        Date : 1,
        number : 2,
    });
    t.end();
});

test('dateMap', function (t) {
    var obj = { x : new Date, y : 10, z : 5 };
    
    var res = traverse(obj).map(function (node) {
        if (typeof node === 'number') this.update(node + 100);
    });
    
    t.ok(obj.x !== res.x);
    t.same(res, {
        x : obj.x,
        y : 110,
        z : 105,
    });
    t.end();
});

