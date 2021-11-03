'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var ToInt32 = require('./ToInt32');
var ToUint32 = require('./ToUint32');
var Type = require('./Type');

// https://262.ecma-international.org/11.0/#sec-numberbitwiseop

module.exports = function NumberBitwiseOp(op, x, y) {
	if (op !== '&' && op !== '|' && op !== '^') {
		throw new $TypeError('Assertion failed: `op` must be `&`, `|`, or `^`');
	}
	if (Type(x) !== 'Number' || Type(y) !== 'Number') {
		throw new $TypeError('Assertion failed: `x` and `y` arguments must be Numbers');
	}
	var lnum = ToInt32(x);
	var rnum = ToUint32(y);
	if (op === '&') {
		return lnum & rnum;
	}
	if (op === '|') {
		return lnum | rnum;
	}
	return lnum ^ rnum;
};
