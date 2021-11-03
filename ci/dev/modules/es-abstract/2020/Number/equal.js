'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var isNaN = require('../../helpers/isNaN');
var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-number-equal

module.exports = function NumberEqual(x, y) {
	if (Type(x) !== 'Number' || Type(y) !== 'Number') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be Numbers');
	}
	if (isNaN(x) || isNaN(y)) {
		return false;
	}
	// shortcut for the actual spec mechanics
	return x === y;
};
