var test = require('tape');
var traverse = require('../');

test('leaves test', function (t) {
    var acc = [];
    traverse({
        a : [1,2,3],
        b : 4,
        c : [5,6],
        d : { e : [7,8], f : 9 }
    }).forEach(function (x) {
        if (this.isLeaf) acc.push(x);
    });
    
    t.equal(
        acc.join(' '),
        '1 2 3 4 5 6 7 8 9',
        'Traversal in the right(?) order'
    );
    
    t.end();
});
