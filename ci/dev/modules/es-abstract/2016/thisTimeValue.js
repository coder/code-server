'use strict';

var $DateValueOf = require('call-bind/callBound')('Date.prototype.valueOf');

// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-date-prototype-object

module.exports = function thisTimeValue(value) {
	return $DateValueOf(value);
};
