'use strict';

var $StringValueOf = require('call-bind/callBound')('String.prototype.valueOf');

var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-string-prototype-object

module.exports = function thisStringValue(value) {
	if (Type(value) === 'String') {
		return value;
	}

	return $StringValueOf(value);
};
