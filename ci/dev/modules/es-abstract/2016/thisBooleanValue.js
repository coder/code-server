'use strict';

var $BooleanValueOf = require('call-bind/callBound')('Boolean.prototype.valueOf');

var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-boolean-prototype-object

module.exports = function thisBooleanValue(value) {
	if (Type(value) === 'Boolean') {
		return value;
	}

	return $BooleanValueOf(value);
};
