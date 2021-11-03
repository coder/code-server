'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Type = require('../Type');
var BigIntEqual = require('./equal');

// https://262.ecma-international.org/11.0/#sec-numeric-types-bigint-sameValueZero

module.exports = function BigIntSameValueZero(x, y) {
	if (Type(x) !== 'BigInt' || Type(y) !== 'BigInt') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be BigInts');
	}

	return BigIntEqual(x, y);
};
