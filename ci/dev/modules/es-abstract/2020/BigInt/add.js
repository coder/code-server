'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-bigint-add

module.exports = function BigIntAdd(x, y) {
	if (Type(x) !== 'BigInt' || Type(y) !== 'BigInt') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be BigInts');
	}

	// shortcut for the actual spec mechanics
	return x + y;
};
