'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var BigIntBitwiseOp = require('../BigIntBitwiseOp');
var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-bigint-bitwiseOR

module.exports = function BigIntBitwiseOR(x, y) {
	if (Type(x) !== 'BigInt' || Type(y) !== 'BigInt') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be BigInts');
	}
	return BigIntBitwiseOp('|', x, y);
};
