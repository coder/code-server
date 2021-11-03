'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var NumberBitwiseOp = require('../NumberBitwiseOp');
var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-number-bitwiseXOR

module.exports = function NumberBitwiseXOR(x, y) {
	if (Type(x) !== 'Number' || Type(y) !== 'Number') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be Numbers');
	}
	return NumberBitwiseOp('^', x, y);
};
