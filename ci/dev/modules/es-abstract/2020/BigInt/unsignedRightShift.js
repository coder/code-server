'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-bigint-unsignedRightShift

module.exports = function BigIntUnsignedRightShift(x, y) {
	if (Type(x) !== 'BigInt' || Type(y) !== 'BigInt') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be BigInts');
	}

	throw new $TypeError('BigInts have no unsigned right shift, use >> instead');
};
