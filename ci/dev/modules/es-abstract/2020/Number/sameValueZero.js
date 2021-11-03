'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var isNaN = require('../../helpers/isNaN');

var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-number-sameValueZero

module.exports = function NumberSameValueZero(x, y) {
	if (Type(x) !== 'Number' || Type(y) !== 'Number') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be Numbers');
	}

	var xNaN = isNaN(x);
	var yNaN = isNaN(y);
	if (xNaN || yNaN) {
		return xNaN === yNaN;
	}
	return x === y;
};
