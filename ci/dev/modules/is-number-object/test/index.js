'use strict';

var test = require('tape');
var isNumber = require('../');
var hasSymbols = require('has-symbols')();

test('not Numbers', function (t) {
	t.notOk(isNumber(), 'undefined is not Number');
	t.notOk(isNumber(null), 'null is not Number');
	t.notOk(isNumber(false), 'false is not Number');
	t.notOk(isNumber(true), 'true is not Number');
	t.notOk(isNumber('foo'), 'string is not Number');
	t.notOk(isNumber([]), 'array is not Number');
	t.notOk(isNumber({}), 'object is not Number');
	t.notOk(isNumber(function () {}), 'function is not Number');
	t.notOk(isNumber(/a/g), 'regex literal is not Number');
	t.notOk(isNumber(new RegExp('a', 'g')), 'regex object is not Number');
	t.notOk(isNumber(new Date()), 'new Date() is not Number');
	t.end();
});

test('@@toStringTag', { skip: !hasSymbols || !Symbol.toStringTag }, function (t) {
	var fakeNumber = {
		toString: function () { return '7'; },
		valueOf: function () { return 42; }
	};
	fakeNumber[Symbol.toStringTag] = 'Number';
	t.notOk(isNumber(fakeNumber), 'fake Number with @@toStringTag "Number" is not Number');
	t.end();
});

test('Numbers', function (t) {
	t.ok(isNumber(42), 'number is Number');
	t.ok(isNumber(Object(42)), 'number object is Number');
	t.ok(isNumber(NaN), 'NaN is Number');
	t.ok(isNumber(Infinity), 'Infinity is Number');
	t.end();
});
