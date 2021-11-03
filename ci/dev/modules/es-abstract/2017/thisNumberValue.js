'use strict';

var callBound = require('call-bind/callBound');

var Type = require('./Type');

var $NumberValueOf = callBound('Number.prototype.valueOf');

// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-number-prototype-object

module.exports = function thisNumberValue(value) {
	if (Type(value) === 'Number') {
		return value;
	}

	return $NumberValueOf(value);
};

