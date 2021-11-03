'use strict';

var GetIntrinsic = require('get-intrinsic');

var $test = GetIntrinsic('RegExp.prototype.test');

var callBind = require('call-bind');

module.exports = function regexTester(regex) {
	return callBind($test, regex);
};
