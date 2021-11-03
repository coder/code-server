var inspect = require('../');
var test = require('tape');

test('negative zero', function (t) {
    t.equal(inspect(0), '0', 'inspect(0) === "0"');
    t.equal(inspect(Object(0)), 'Object(0)', 'inspect(Object(0)) === "Object(0)"');

    t.equal(inspect(-0), '-0', 'inspect(-0) === "-0"');
    t.equal(inspect(Object(-0)), 'Object(-0)', 'inspect(Object(-0)) === "Object(-0)"');

    t.end();
});
