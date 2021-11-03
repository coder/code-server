'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var isNaN = require('../../helpers/isNaN');

var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-number-lessThan

module.exports = function NumberLessThan(x, y) {
	if (Type(x) !== 'Number' || Type(y) !== 'Number') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be Numbers');
	}

	// If x is NaN, return undefined.
	// If y is NaN, return undefined.
	if (isNaN(x) || isNaN(y)) {
		return void undefined;
	}

	// shortcut for the actual spec mechanics
	return x < y;
};
