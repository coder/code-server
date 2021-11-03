var test = require('tape');
var traverse = require('../');

test('interface map', function (t) {
    var obj = { a : [ 5,6,7 ], b : { c : [8] } };
    
    t.same(
        traverse.paths(obj)
            .sort()
            .map(function (path) { return path.join('/') })
            .slice(1)
            .join(' ')
         ,
         'a a/0 a/1 a/2 b b/c b/c/0'
    );
    
    t.same(
        traverse.nodes(obj),
        [
            { a: [ 5, 6, 7 ], b: { c: [ 8 ] } },
            [ 5, 6, 7 ], 5, 6, 7,
            { c: [ 8 ] }, [ 8 ], 8
        ]
    );
    
    t.same(
        traverse.map(obj, function (node) {
            if (typeof node == 'number') {
                return node + 1000;
            }
            else if (Array.isArray(node)) {
                return node.join(' ');
            }
        }),
        { a: '5 6 7', b: { c: '8' } }
    );
    
    var nodes = 0;
    traverse.forEach(obj, function (node) { nodes ++ });
    t.same(nodes, 8);
    
    t.end();
});
