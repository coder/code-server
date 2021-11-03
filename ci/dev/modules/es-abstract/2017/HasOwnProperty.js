'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var has = require('has');

var IsPropertyKey = require('./IsPropertyKey');
var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-hasownproperty

module.exports = function HasOwnProperty(O, P) {
	if (Type(O) !== 'Object') {
		throw new $TypeError('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError('Assertion failed: `P` must be a Property Key');
	}
	return has(O, P);
};
