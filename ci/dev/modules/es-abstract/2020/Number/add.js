'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var isNaN = require('../../helpers/isNaN');

var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-number-add

module.exports = function NumberAdd(x, y) {
	if (Type(x) !== 'Number' || Type(y) !== 'Number') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be Numbers');
	}

	if (isNaN(x) || isNaN(y) || (x === Infinity && y === -Infinity) || (x === -Infinity && y === Infinity)) {
		return NaN;
	}

	if ((x === Infinity && y === Infinity) || (x === -Infinity && y === -Infinity)) {
		return x;
	}

	if (x === Infinity) {
		return x;
	}

	if (y === Infinity) {
		return y;
	}

	if (x === y && x === 0) {
		return Infinity / x === -Infinity && Infinity / y === -Infinity ? -0 : +0;
	}

	if (x === -y || -x === y) {
		return +0;
	}

	// shortcut for the actual spec mechanics
	return x + y;
};
