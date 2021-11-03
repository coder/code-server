'use strict';

var GetIntrinsic = require('get-intrinsic');

var $String = GetIntrinsic('%String%');
var $TypeError = GetIntrinsic('%TypeError%');

var Type = require('../Type');

// https://262.ecma-international.org/11.0/#sec-numeric-types-number-tostring

module.exports = function NumberToString(x) {
	if (Type(x) !== 'Number') {
		throw new $TypeError('Assertion failed: `x` must be a Number');
	}

	return $String(x);
};
