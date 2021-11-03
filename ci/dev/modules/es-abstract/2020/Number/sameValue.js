'use strict';

var GetIntrinsic = require('get-intrinsic');
var isNegativeZero = require('is-negative-zero');

var $TypeError = GetIntrinsic('%TypeError%');

var Type = require('../Type');
var NumberSameValueZero = require('./sameValueZero');

// https://262.ecma-international.org/11.0/#sec-numeric-types-number-sameValue

module.exports = function NumberSameValue(x, y) {
	if (Type(x) !== 'Number' || Type(y) !== 'Number') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be Numbers');
	}
	if (x === 0 && y === 0) {
		return !(isNegativeZero(x) ^ isNegativeZero(y));
	}
	return NumberSameValueZero(x, y);
};
