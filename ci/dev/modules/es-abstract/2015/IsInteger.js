'use strict';

var abs = require('./abs');
var floor = require('./floor');

var $isNaN = require('../helpers/isNaN');
var $isFinite = require('../helpers/isFinite');

// https://ecma-international.org/ecma-262/6.0/#sec-isinteger

module.exports = function IsInteger(argument) {
	if (typeof argument !== 'number' || $isNaN(argument) || !$isFinite(argument)) {
		return false;
	}
	var absValue = abs(argument);
	return floor(absValue) === absValue;
};
