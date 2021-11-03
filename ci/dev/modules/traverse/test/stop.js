var test = require('tape');
var traverse = require('../');

test('stop', function (t) {
    var visits = 0;
    traverse('abcdefghij'.split('')).forEach(function (node) {
        if (typeof node === 'string') {
            visits ++;
            if (node === 'e') this.stop()
        }
    });
    
    t.equal(visits, 5);
    t.end();
});

test('stopMap', function (t) {
    var s = traverse('abcdefghij'.split('')).map(function (node) {
        if (typeof node === 'string') {
            if (node === 'e') this.stop()
            return node.toUpperCase();
        }
    }).join('');
    
    t.equal(s, 'ABCDEfghij');
    t.end();
});

test('stopReduce', function (t) {
    var obj = {
        a : [ 4, 5 ],
        b : [ 6, [ 7, 8, 9 ] ]
    };
    var xs = traverse(obj).reduce(function (acc, node) {
        if (this.isLeaf) {
            if (node === 7) this.stop();
            else acc.push(node)
        }
        return acc;
    }, []);
    
    t.same(xs, [ 4, 5, 6 ]);
    t.end();
});
