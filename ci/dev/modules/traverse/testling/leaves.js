var traverse = require('./');
var test = require('testling');

test('leaves', function (t) {
    var obj = {
        a : [1,2,3],
        b : 4,
        c : [5,6],
        d : { e : [7,8], f : 9 }
    };
    
    var acc = [];
    traverse(obj).forEach(function (x) {
        if (this.isLeaf) acc.push(x);
    });
    
    t.deepEqual(
        acc, [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ],
        'traversal in the proper order'
    );
    t.end();
});
