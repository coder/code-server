'use strict';

var GetIntrinsic = require('get-intrinsic');
var callBound = require('call-bind/callBound');

var $TypeError = GetIntrinsic('%TypeError%');

var IsInteger = require('./IsInteger');
var Type = require('./Type');

var $charAt = callBound('String.prototype.charAt');

// https://262.ecma-international.org/6.0/#sec-splitmatch

module.exports = function SplitMatch(S, q, R) {
	if (Type(S) !== 'String') {
		throw new $TypeError('Assertion failed: `S` must be a String');
	}
	if (!IsInteger(q)) {
		throw new $TypeError('Assertion failed: `q` must be an integer');
	}
	if (Type(R) !== 'String') {
		throw new $TypeError('Assertion failed: `R` must be a String');
	}
	var r = R.length;
	var s = S.length;
	if (q + r > s) {
		return false;
	}

	for (var i = 0; i < r; i += 1) {
		if ($charAt(S, q + i) !== $charAt(R, i)) {
			return false;
		}
	}

	return q + r;
};
