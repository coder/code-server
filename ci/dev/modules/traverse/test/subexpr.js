var traverse = require('../');
var test = require('tape');

test('subexpr', function (t) {
    var obj = [ 'a', 4, 'b', 5, 'c', 6 ];
    var r = traverse(obj).map(function (x) {
        if (typeof x === 'number') {
            this.update([ x - 0.1, x, x + 0.1 ], true);
        }
    });
    
    t.same(obj, [ 'a', 4, 'b', 5, 'c', 6 ]);
    t.same(r, [
        'a', [ 3.9, 4, 4.1 ],
        'b', [ 4.9, 5, 5.1 ],
        'c', [ 5.9, 6, 6.1 ],
    ]);
    t.end();
});

test('block', function (t) {
    var obj = [ [ 1 ], [ 2 ], [ 3 ] ];
    var r = traverse(obj).map(function (x) {
        if (Array.isArray(x) && !this.isRoot) {
            if (x[0] === 5) this.block()
            else this.update([ [ x[0] + 1 ] ])
        }
    });
    
    t.same(r, [
        [ [ [ [ [ 5 ] ] ] ] ],
        [ [ [ [ 5 ] ] ] ],
        [ [ [ 5 ] ] ],
    ]);
    t.end();
});
