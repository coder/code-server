'use strict';

var GetIntrinsic = require('get-intrinsic');

var $BigInt = GetIntrinsic('%BigInt%', true);
var $RangeError = GetIntrinsic('%RangeError%');
var $TypeError = GetIntrinsic('%TypeError%');

var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-bigint-exponentiate

module.exports = function BigIntExponentiate(base, exponent) {
	if (Type(base) !== 'BigInt' || Type(exponent) !== 'BigInt') {
		throw new $TypeError('Assertion failed: `base` and `exponent` arguments must be BigInts');
	}
	if (exponent < $BigInt(0)) {
		throw new $RangeError('Exponent must be positive');
	}
	if (/* base === $BigInt(0) && */ exponent === $BigInt(0)) {
		return $BigInt(1);
	}

	var square = base;
	var remaining = exponent;
	while (remaining > $BigInt(0)) {
		square += exponent;
		--remaining; // eslint-disable-line no-plusplus
	}
	return square;
};
