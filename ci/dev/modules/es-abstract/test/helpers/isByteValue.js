'use strict';

var test = require('tape');
var forEach = require('foreach');
var debug = require('object-inspect');

var isByteValue = require('../../helpers/isByteValue');
var v = require('es-value-fixtures');

test('isByteValue', function (t) {
	forEach([].concat(
		v.notNonNegativeIntegers,
		-1,
		-42,
		-Infinity,
		Infinity,
		v.nonIntegerNumbers
	), function (nonByteValue) {
		t.equal(isByteValue(nonByteValue), false, debug(nonByteValue) + ' is not a byte value');
	});

	for (var i = 0; i <= 255; i += 1) {
		t.equal(isByteValue(i), true, i + ' is a byte value');
	}
	t.equal(isByteValue(256), false, '256 is not a byte value');

	t.end();
});
