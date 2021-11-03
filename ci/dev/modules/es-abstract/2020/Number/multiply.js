'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var isNaN = require('../../helpers/isNaN');

var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-number-multiply

module.exports = function NumberMultiply(x, y) {
	if (Type(x) !== 'Number' || Type(y) !== 'Number') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be Numbers');
	}

	if (isNaN(x) || isNaN(y) || (x === 0 && !isFinite(y)) || (!isFinite(x) && y === 0)) {
		return NaN;
	}
	if (!isFinite(x) && !isFinite(y)) {
		return x === y ? Infinity : -Infinity;
	}
	if (!isFinite(x) && y !== 0) {
		return x > 0 ? Infinity : -Infinity;
	}
	if (!isFinite(y) && x !== 0) {
		return y > 0 ? Infinity : -Infinity;
	}

	// shortcut for the actual spec mechanics
	return x * y;
};
