'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var isFinite = require('../../helpers/isFinite');
var isNaN = require('../../helpers/isNaN');
var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-number-divide

module.exports = function NumberDivide(x, y) {
	if (Type(x) !== 'Number' || Type(y) !== 'Number') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be Numbers');
	}
	if (isNaN(x) || isNaN(y) || (!isFinite(x) && !isFinite(y))) {
		return NaN;
	}
	// shortcut for the actual spec mechanics
	return x / y;
};
