'use strict';

var GetIntrinsic = require('get-intrinsic');

var $String = GetIntrinsic('%String%');

var ToPrimitive = require('./ToPrimitive');
var ToString = require('./ToString');

// https://ecma-international.org/ecma-262/6.0/#sec-topropertykey

module.exports = function ToPropertyKey(argument) {
	var key = ToPrimitive(argument, $String);
	return typeof key === 'symbol' ? key : ToString(key);
};
