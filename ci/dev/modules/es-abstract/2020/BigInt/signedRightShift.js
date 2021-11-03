'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Type = require('../Type');
var BigIntLeftShift = require('./leftShift');

// https://262.ecma-international.org/11.0/#sec-numeric-types-bigint-signedRightShift

module.exports = function BigIntSignedRightShift(x, y) {
	if (Type(x) !== 'BigInt' || Type(y) !== 'BigInt') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be BigInts');
	}

	return BigIntLeftShift(x, -y);
};
