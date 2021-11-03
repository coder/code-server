var test = require('tape');
var traverse = require('../');

test('siblings', function (t) {
    var obj = { a : 1, b : 2, c : [ 4, 5, 6 ] };
    
    var res = traverse(obj).reduce(function (acc, x) {
        var p = '/' + this.path.join('/');
        if (this.parent) {
            acc[p] = {
                siblings : this.parent.keys,
                key : this.key,
                index : this.parent.keys.indexOf(this.key)
            };
        }
        else {
            acc[p] = {
                siblings : [],
                key : this.key,
                index : -1
            }
        }
        return acc;
    }, {});
    
    t.same(res, {
        '/' : { siblings : [], key : undefined, index : -1 },
        '/a' : { siblings : [ 'a', 'b', 'c' ], key : 'a', index : 0 },
        '/b' : { siblings : [ 'a', 'b', 'c' ], key : 'b', index : 1 },
        '/c' : { siblings : [ 'a', 'b', 'c' ], key : 'c', index : 2 },
        '/c/0' : { siblings : [ '0', '1', '2' ], key : '0', index : 0 },
        '/c/1' : { siblings : [ '0', '1', '2' ], key : '1', index : 1 },
        '/c/2' : { siblings : [ '0', '1', '2' ], key : '2', index : 2 }
    });
    
    t.end();
});
