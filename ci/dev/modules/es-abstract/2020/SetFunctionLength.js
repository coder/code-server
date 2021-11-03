'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var DefinePropertyOrThrow = require('./DefinePropertyOrThrow');
var HasOwnProperty = require('./HasOwnProperty');
var IsExtensible = require('./IsExtensible');
var IsNonNegativeInteger = require('./IsNonNegativeInteger');
var Type = require('./Type');

// https://262.ecma-international.org/11.0/#sec-setfunctionlength

module.exports = function SetFunctionLength(F, length) {
	if (typeof F !== 'function' || !IsExtensible(F) || HasOwnProperty(F, 'length')) {
		throw new $TypeError('Assertion failed: `F` must be an extensible function and lack an own `length` property');
	}
	if (Type(length) !== 'Number') {
		throw new $TypeError('Assertion failed: `length` must be a Number');
	}
	if (!IsNonNegativeInteger(length)) {
		throw new $TypeError('Assertion failed: `length` must be an integer >= 0');
	}
	return DefinePropertyOrThrow(F, 'length', {
		'[[Configurable]]': true,
		'[[Enumerable]]': false,
		'[[Value]]': length,
		'[[Writable]]': false
	});
};
