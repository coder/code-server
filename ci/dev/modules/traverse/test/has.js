var test = require('tape');
var traverse = require('../');

test('has', function (t) {
    var obj = { a : 2, b : [ 4, 5, { c : 6 } ] };
    
    t.equal(traverse(obj).has([ 'b', 2, 'c' ]), true)
    t.equal(traverse(obj).has([ 'b', 2, 'c', 0 ]), false)
    t.equal(traverse(obj).has([ 'b', 2, 'd' ]), false)
    t.equal(traverse(obj).has([]), true)
    t.equal(traverse(obj).has([ 'a' ]), true)
    t.equal(traverse(obj).has([ 'a', 2 ]), false)
    
    t.end();
});
