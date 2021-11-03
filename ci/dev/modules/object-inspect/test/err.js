var inspect = require('../');
var test = require('tape');

test('type error', function (t) {
    t.plan(1);
    var aerr = new TypeError();
    aerr.foo = 555;
    aerr.bar = [1, 2, 3];

    var berr = new TypeError('tuv');
    berr.baz = 555;

    var cerr = new SyntaxError();
    cerr.message = 'whoa';
    cerr['a-b'] = 5;

    var obj = [
        new TypeError(),
        new TypeError('xxx'),
        aerr,
        berr,
        cerr
    ];
    t.equal(inspect(obj), '[ ' + [
        '[TypeError]',
        '[TypeError: xxx]',
        '{ [TypeError] foo: 555, bar: [ 1, 2, 3 ] }',
        '{ [TypeError: tuv] baz: 555 }',
        '{ [SyntaxError: whoa] message: \'whoa\', \'a-b\': 5 }'
    ].join(', ') + ' ]');
});
