'use strict';

var ToNumber = require('./ToNumber');
var floor = require('./floor');

var $isNaN = require('../helpers/isNaN');

// https://ecma-international.org/ecma-262/6.0/#sec-touint8clamp

module.exports = function ToUint8Clamp(argument) {
	var number = ToNumber(argument);
	if ($isNaN(number) || number <= 0) { return 0; }
	if (number >= 0xFF) { return 0xFF; }
	var f = floor(argument);
	if (f + 0.5 < number) { return f + 1; }
	if (number < f + 0.5) { return f; }
	if (f % 2 !== 0) { return f + 1; }
	return f;
};
