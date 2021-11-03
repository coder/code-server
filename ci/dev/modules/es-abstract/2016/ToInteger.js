'use strict';

var ES5ToInteger = require('../5/ToInteger');

var ToNumber = require('./ToNumber');

// https://ecma-international.org/ecma-262/6.0/#sec-tointeger

module.exports = function ToInteger(value) {
	var number = ToNumber(value);
	return ES5ToInteger(number);
};
