'use strict';

var GetIntrinsic = require('get-intrinsic');

var IsInteger = require('./IsInteger');
var Type = require('./Type');

var MAX_SAFE_INTEGER = require('../helpers/maxSafeInteger');
var isLeadingSurrogate = require('../helpers/isLeadingSurrogate');
var isTrailingSurrogate = require('../helpers/isTrailingSurrogate');

var $TypeError = GetIntrinsic('%TypeError%');

var $charCodeAt = require('call-bind/callBound')('String.prototype.charCodeAt');

// https://ecma-international.org/ecma-262/6.0/#sec-advancestringindex

module.exports = function AdvanceStringIndex(S, index, unicode) {
	if (Type(S) !== 'String') {
		throw new $TypeError('Assertion failed: `S` must be a String');
	}
	if (!IsInteger(index) || index < 0 || index > MAX_SAFE_INTEGER) {
		throw new $TypeError('Assertion failed: `length` must be an integer >= 0 and <= 2**53');
	}
	if (Type(unicode) !== 'Boolean') {
		throw new $TypeError('Assertion failed: `unicode` must be a Boolean');
	}
	if (!unicode) {
		return index + 1;
	}
	var length = S.length;
	if ((index + 1) >= length) {
		return index + 1;
	}

	var first = $charCodeAt(S, index);
	if (!isLeadingSurrogate(first)) {
		return index + 1;
	}

	var second = $charCodeAt(S, index + 1);
	if (!isTrailingSurrogate(second)) {
		return index + 1;
	}

	return index + 2;
};
