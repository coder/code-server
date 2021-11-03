'use strict';

var inspect = require('../');
var test = require('tape');
var hasSymbols = require('has-symbols')();
var forEach = require('for-each');

test('fakes', { skip: !hasSymbols || typeof Symbol.toStringTag !== 'symbol' }, function (t) {
    forEach([
        'Array',
        'Boolean',
        'Date',
        'Error',
        'Number',
        'RegExp',
        'String'
    ], function (expected) {
        var faker = {};
        faker[Symbol.toStringTag] = expected;

        t.equal(
            inspect(faker),
            '{ [Symbol(Symbol.toStringTag)]: \'' + expected + '\' }',
            'faker masquerading as ' + expected + ' is not shown as one'
        );
    });

    t.end();
});
