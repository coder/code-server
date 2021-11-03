'use strict';

var GetIntrinsic = require('get-intrinsic');

var $BigInt = GetIntrinsic('%BigInt%', true);
var $TypeError = GetIntrinsic('%TypeError%');

var Type = require('../Type');

var zero = $BigInt && $BigInt(0);

// https://262.ecma-international.org/11.0/#sec-numeric-types-bigint-unaryMinus

module.exports = function BigIntUnaryMinus(x) {
	if (Type(x) !== 'BigInt') {
		throw new $TypeError('Assertion failed: `x` argument must be a BigInt');
	}

	if (x === zero) {
		return zero;
	}

	return -x;
};
