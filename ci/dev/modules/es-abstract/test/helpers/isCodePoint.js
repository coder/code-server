'use strict';

var test = require('tape');
var forEach = require('foreach');
var debug = require('object-inspect');

var isCodePoint = require('../../helpers/isCodePoint');
var v = require('es-value-fixtures');

test('isCodePoint', function (t) {
	forEach(v.notNonNegativeIntegers.concat(0x10FFFF + 1), function (nonCodePoints) {
		t.equal(isCodePoint(nonCodePoints), false, debug(nonCodePoints) + ' is not a Code Point');
	});

	forEach([-0, 0, 1, 7, 42, 0x10FFFF], function (codePoint) {
		t.equal(isCodePoint(codePoint), true, debug(codePoint) + ' is a Code Point');
	});

	t.end();
});
