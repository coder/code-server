var test = require('tape');
var traverse = require('../');
var deepEqual = require('./lib/deep_equal');

test('deepDates', function (t) {
    t.plan(2);
    
    t.ok(
        deepEqual(
            { d : new Date, x : [ 1, 2, 3 ] },
            { d : new Date, x : [ 1, 2, 3 ] }
        ),
        'dates should be equal'
    );
    
    var d0 = new Date;
    setTimeout(function () {
        t.ok(
            !deepEqual(
                { d : d0, x : [ 1, 2, 3 ], },
                { d : new Date, x : [ 1, 2, 3 ] }
            ),
            'microseconds should count in date equality'
        );
    }, 5);
});

test('deepCircular', function (t) {
    var a = [1];
    a.push(a); // a = [ 1, *a ]
    
    var b = [1];
    b.push(a); // b = [ 1, [ 1, *a ] ]
    
    t.ok(
        !deepEqual(a, b),
        'circular ref mount points count towards equality'
    );
    
    var c = [1];
    c.push(c); // c = [ 1, *c ]
    t.ok(
        deepEqual(a, c),
        'circular refs are structurally the same here'
    );
    
    var d = [1];
    d.push(a); // c = [ 1, [ 1, *d ] ]
    t.ok(
        deepEqual(b, d),
        'non-root circular ref structural comparison'
    );
    
    t.end();
});

test('deepInstances', function (t) {
    t.ok(
        !deepEqual([ new Boolean(false) ], [ false ]),
        'boolean instances are not real booleans'
    );
    
    t.ok(
        !deepEqual([ new String('x') ], [ 'x' ]),
        'string instances are not real strings'
    );
    
    t.ok(
        !deepEqual([ new Number(4) ], [ 4 ]),
        'number instances are not real numbers'
    );
    
    t.ok(
        deepEqual([ new RegExp('x') ], [ /x/ ]),
        'regexp instances are real regexps'
    );
    
    t.ok(
        !deepEqual([ new RegExp(/./) ], [ /../ ]),
        'these regexps aren\'t the same'
    );
    
    t.ok(
        !deepEqual(
            [ function (x) { return x * 2 } ],
            [ function (x) { return x * 2 } ]
        ),
        'functions with the same .toString() aren\'t necessarily the same'
    );
    
    var f = function (x) { return x * 2 };
    t.ok(
        deepEqual([ f ], [ f ]),
        'these functions are actually equal'
    );
    
    t.end();
});

test('deepEqual', function (t) {
    t.ok(
        !deepEqual([ 1, 2, 3 ], { 0 : 1, 1 : 2, 2 : 3 }),
        'arrays are not objects'
    );
    t.end();
});

test('falsy', function (t) {
    t.ok(
        !deepEqual([ undefined ], [ null ]),
        'null is not undefined!'
    );
    
    t.ok(
        !deepEqual([ null ], [ undefined ]),
        'undefined is not null!'
    );
    
    t.ok(
        !deepEqual(
            { a : 1, b : 2, c : [ 3, undefined, 5 ] },
            { a : 1, b : 2, c : [ 3, null, 5 ] }
        ),
        'undefined is not null, however deeply!'
    );
    
    t.ok(
        !deepEqual(
            { a : 1, b : 2, c : [ 3, undefined, 5 ] },
            { a : 1, b : 2, c : [ 3, null, 5 ] }
        ),
        'null is not undefined, however deeply!'
    );
    
    t.ok(
        !deepEqual(
            { a : 1, b : 2, c : [ 3, undefined, 5 ] },
            { a : 1, b : 2, c : [ 3, null, 5 ] }
        ),
        'null is not undefined, however deeply!'
    );
    
    t.end();
});

test('deletedArrayEqual', function (t) {
    var xs = [ 1, 2, 3, 4 ];
    delete xs[2];
    
    var ys = Object.create(Array.prototype);
    ys[0] = 1;
    ys[1] = 2;
    ys[3] = 4;
    
    t.ok(
        deepEqual(xs, ys),
        'arrays with deleted elements are only equal to'
        + ' arrays with similarly deleted elements'
    );
    
    t.ok(
        !deepEqual(xs, [ 1, 2, undefined, 4 ]),
        'deleted array elements cannot be undefined'
    );
    
    t.ok(
        !deepEqual(xs, [ 1, 2, null, 4 ]),
        'deleted array elements cannot be null'
    );
    
    t.end();
});

test('deletedObjectEqual', function (t) {
    var obj = { a : 1, b : 2, c : 3 };
    delete obj.c;
    
    t.ok(
        deepEqual(obj, { a : 1, b : 2 }),
        'deleted object elements should not show up'
    );
    
    t.ok(
        !deepEqual(obj, { a : 1, b : 2, c : undefined }),
        'deleted object elements are not undefined'
    );
    
    t.ok(
        !deepEqual(obj, { a : 1, b : 2, c : null }),
        'deleted object elements are not null'
    );
    
    t.end();
});

test('emptyKeyEqual', function (t) {
    t.ok(!deepEqual(
        { a : 1 }, { a : 1, '' : 55 }
    ));
    
    t.end();
});

test('deepArguments', function (t) {
    t.ok(
        !deepEqual(
            [ 4, 5, 6 ],
            (function () { return arguments })(4, 5, 6)
        ),
        'arguments are not arrays'
    );
    
    t.ok(
        deepEqual(
            (function () { return arguments })(4, 5, 6),
            (function () { return arguments })(4, 5, 6)
        ),
        'arguments should equal'
    );
    
    t.end();
});

test('deepUn', function (t) {
    t.ok(!deepEqual({ a : 1, b : 2 }, undefined));
    t.ok(!deepEqual({ a : 1, b : 2 }, {}));
    t.ok(!deepEqual(undefined, { a : 1, b : 2 }));
    t.ok(!deepEqual({}, { a : 1, b : 2 }));
    t.ok(deepEqual(undefined, undefined));
    t.ok(deepEqual(null, null));
    t.ok(!deepEqual(undefined, null));
    
    t.end();
});

test('deepLevels', function (t) {
    var xs = [ 1, 2, [ 3, 4, [ 5, 6 ] ] ];
    t.ok(!deepEqual(xs, []));
    t.end();
});
