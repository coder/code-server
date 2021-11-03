'use strict';

var GetIntrinsic = require('get-intrinsic');

var $BigInt = GetIntrinsic('%BigInt%', true);
var $TypeError = GetIntrinsic('%TypeError%');

var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-bigint-bitwiseNOT

module.exports = function BigIntBitwiseNOT(x) {
	if (Type(x) !== 'BigInt') {
		throw new $TypeError('Assertion failed: `x` argument must be a BigInt');
	}
	return -x - $BigInt(1);
};
