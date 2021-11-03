'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var isNaN = require('../../helpers/isNaN');

var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-number-unaryMinus

module.exports = function NumberUnaryMinus(x) {
	if (Type(x) !== 'Number') {
		throw new $TypeError('Assertion failed: `x` argument must be a Number');
	}
	if (isNaN(x)) {
		return NaN;
	}
	return -x;
};
