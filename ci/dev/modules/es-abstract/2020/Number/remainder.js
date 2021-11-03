'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var isNaN = require('../../helpers/isNaN');

var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-number-remainder

module.exports = function NumberRemainder(n, d) {
	if (Type(n) !== 'Number' || Type(d) !== 'Number') {
		throw new $TypeError('Assertion failed: `n` and `d` arguments must be Numbers');
	}

	// If either operand is NaN, the result is NaN.
	// If the dividend is an infinity, or the divisor is a zero, or both, the result is NaN.
	if (isNaN(n) || isNaN(d) || !isFinite(n) || d === 0) {
		return NaN;
	}

	// If the dividend is finite and the divisor is an infinity, the result equals the dividend.
	// If the dividend is a zero and the divisor is nonzero and finite, the result is the same as the dividend.
	if (!isFinite(d) || (n === 0 && d !== 0)) {
		return n;
	}

	// In the remaining cases, where neither an infinity, nor a zero, nor NaN is involved…
	return n % d;
};
