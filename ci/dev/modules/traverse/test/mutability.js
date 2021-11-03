var test = require('tape');
var traverse = require('../');
var deepEqual = require('./lib/deep_equal');

test('mutate', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = traverse(obj).forEach(function (x) {
        if (typeof x === 'number' && x % 2 === 0) {
            this.update(x * 10);
        }
    });
    t.same(obj, res);
    t.same(obj, { a : 1, b : 20, c : [ 3, 40 ] });
    t.end();
});

test('mutateT', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = traverse.forEach(obj, function (x) {
        if (typeof x === 'number' && x % 2 === 0) {
            this.update(x * 10);
        }
    });
    t.same(obj, res);
    t.same(obj, { a : 1, b : 20, c : [ 3, 40 ] });
    t.end();
});

test('map', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = traverse(obj).map(function (x) {
        if (typeof x === 'number' && x % 2 === 0) {
            this.update(x * 10);
        }
    });
    t.same(obj, { a : 1, b : 2, c : [ 3, 4 ] });
    t.same(res, { a : 1, b : 20, c : [ 3, 40 ] });
    t.end();
});

test('mapT', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = traverse.map(obj, function (x) {
        if (typeof x === 'number' && x % 2 === 0) {
            this.update(x * 10);
        }
    });
    t.same(obj, { a : 1, b : 2, c : [ 3, 4 ] });
    t.same(res, { a : 1, b : 20, c : [ 3, 40 ] });
    t.end();
});

test('clone', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = traverse(obj).clone();
    t.same(obj, res);
    t.ok(obj !== res);
    obj.a ++;
    t.same(res.a, 1);
    obj.c.push(5);
    t.same(res.c, [ 3, 4 ]);
    t.end();
});

test('cloneT', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = traverse.clone(obj);
    t.same(obj, res);
    t.ok(obj !== res);
    obj.a ++;
    t.same(res.a, 1);
    obj.c.push(5);
    t.same(res.c, [ 3, 4 ]);
    t.end();
});

test('reduce', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = traverse(obj).reduce(function (acc, x) {
        if (this.isLeaf) acc.push(x);
        return acc;
    }, []);
    t.same(obj, { a : 1, b : 2, c : [ 3, 4 ] });
    t.same(res, [ 1, 2, 3, 4 ]);
    t.end();
});

test('reduceInit', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = traverse(obj).reduce(function (acc, x) {
        if (this.isRoot) assert.fail('got root');
        return acc;
    });
    t.same(obj, { a : 1, b : 2, c : [ 3, 4 ] });
    t.same(res, obj);
    t.end();
});

test('remove', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    traverse(obj).forEach(function (x) {
        if (this.isLeaf && x % 2 == 0) this.remove();
    });
    
    t.same(obj, { a : 1, c : [ 3 ] });
    t.end();
});

exports.removeNoStop = function() {
    var obj = { a : 1, b : 2, c : { d: 3, e: 4 }, f: 5 };
    
    var keys = [];
    traverse(obj).forEach(function (x) {
        keys.push(this.key)
        if (this.key == 'c') this.remove();
    });

    t.same(keys, [undefined, 'a', 'b', 'c', 'd', 'e', 'f'])
    t.end();
}

exports.removeStop = function() {
    var obj = { a : 1, b : 2, c : { d: 3, e: 4 }, f: 5 };
    
    var keys = [];
    traverse(obj).forEach(function (x) {
        keys.push(this.key)
        if (this.key == 'c') this.remove(true);
    });

    t.same(keys, [undefined, 'a', 'b', 'c', 'f'])
    t.end();
}

test('removeMap', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = traverse(obj).map(function (x) {
        if (this.isLeaf && x % 2 == 0) this.remove();
    });
    
    t.same(obj, { a : 1, b : 2, c : [ 3, 4 ] });
    t.same(res, { a : 1, c : [ 3 ] });
    t.end();
});

test('delete', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    traverse(obj).forEach(function (x) {
        if (this.isLeaf && x % 2 == 0) this.delete();
    });
    
    t.ok(!deepEqual(
        obj, { a : 1, c : [ 3, undefined ] }
    ));
    
    t.ok(deepEqual(
        obj, { a : 1, c : [ 3 ] }
    ));
    
    t.ok(!deepEqual(
        obj, { a : 1, c : [ 3, null ] }
    ));
    t.end();
});

test('deleteNoStop', function (t) {
    var obj = { a : 1, b : 2, c : { d: 3, e: 4 } };
    
    var keys = [];
    traverse(obj).forEach(function (x) {
        keys.push(this.key)
        if (this.key == 'c') this.delete();
    });

    t.same(keys, [undefined, 'a', 'b', 'c', 'd', 'e'])
    t.end();
});

test('deleteStop', function (t) {
    var obj = { a : 1, b : 2, c : { d: 3, e: 4 } };
    
    var keys = [];
    traverse(obj).forEach(function (x) {
        keys.push(this.key)
        if (this.key == 'c') this.delete(true);
    });

    t.same(keys, [undefined, 'a', 'b', 'c'])
    t.end();
});

test('deleteRedux', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4, 5 ] };
    traverse(obj).forEach(function (x) {
        if (this.isLeaf && x % 2 == 0) this.delete();
    });
    
    t.ok(!deepEqual(
        obj, { a : 1, c : [ 3, undefined, 5 ] }
    ));
    
    t.ok(deepEqual(
        obj, { a : 1, c : [ 3 ,, 5 ] }
    ));
    
    t.ok(!deepEqual(
        obj, { a : 1, c : [ 3, null, 5 ] }
    ));
    
    t.ok(!deepEqual(
        obj, { a : 1, c : [ 3, 5 ] }
    ));
    
    t.end();
});

test('deleteMap', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = traverse(obj).map(function (x) {
        if (this.isLeaf && x % 2 == 0) this.delete();
    });
    
    t.ok(deepEqual(
        obj,
        { a : 1, b : 2, c : [ 3, 4 ] }
    ));
    
    var xs = [ 3, 4 ];
    delete xs[1];
    
    t.ok(deepEqual(
        res, { a : 1, c : xs }
    ));
    
    t.ok(deepEqual(
        res, { a : 1, c : [ 3, ] }
    ));
    
    t.ok(deepEqual(
        res, { a : 1, c : [ 3 ] }
    ));
    
    t.end();
});

test('deleteMapRedux', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4, 5 ] };
    var res = traverse(obj).map(function (x) {
        if (this.isLeaf && x % 2 == 0) this.delete();
    });
    
    t.ok(deepEqual(
        obj,
        { a : 1, b : 2, c : [ 3, 4, 5 ] }
    ));
    
    var xs = [ 3, 4, 5 ];
    delete xs[1];
    
    t.ok(deepEqual(
        res, { a : 1, c : xs }
    ));
    
    t.ok(!deepEqual(
        res, { a : 1, c : [ 3, 5 ] }
    ));
    
    t.ok(deepEqual(
        res, { a : 1, c : [ 3 ,, 5 ] }
    ));
    
    t.end();
});

test('objectToString', function (t) {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = traverse(obj).forEach(function (x) {
        if (typeof x === 'object' && !this.isRoot) {
            this.update(JSON.stringify(x));
        }
    });
    t.same(obj, res);
    t.same(obj, { a : 1, b : 2, c : "[3,4]" });
    t.end();
});

test('stringToObject', function (t) {
    var obj = { a : 1, b : 2, c : "[3,4]" };
    var res = traverse(obj).forEach(function (x) {
        if (typeof x === 'string') {
            this.update(JSON.parse(x));
        }
        else if (typeof x === 'number' && x % 2 === 0) {
            this.update(x * 10);
        }
    });
    t.deepEqual(obj, res);
    t.deepEqual(obj, { a : 1, b : 20, c : [ 3, 40 ] });
    t.end();
});
