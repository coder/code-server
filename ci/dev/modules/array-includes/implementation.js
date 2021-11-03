'use strict';

var ToInteger = require('es-abstract/2020/ToInteger');
var ToLength = require('es-abstract/2020/ToLength');
var ToObject = require('es-abstract/2020/ToObject');
var SameValueZero = require('es-abstract/2020/SameValueZero');
var $isNaN = require('es-abstract/helpers/isNaN');
var $isFinite = require('es-abstract/helpers/isFinite');
var GetIntrinsic = require('get-intrinsic');
var callBound = require('call-bind/callBound');
var isString = require('is-string');

var $charAt = callBound('String.prototype.charAt');
var $indexOf = GetIntrinsic('%Array.prototype.indexOf%'); // TODO: use callBind.apply without breaking IE 8

module.exports = function includes(searchElement) {
	var fromIndex = arguments.length > 1 ? ToInteger(arguments[1]) : 0;
	if ($indexOf && !$isNaN(searchElement) && $isFinite(fromIndex) && typeof searchElement !== 'undefined') {
		return $indexOf.apply(this, arguments) > -1;
	}

	var O = ToObject(this);
	var length = ToLength(O.length);
	if (length === 0) {
		return false;
	}
	var k = fromIndex >= 0 ? fromIndex : Math.max(0, length + fromIndex);
	while (k < length) {
		if (SameValueZero(searchElement, isString(O) ? $charAt(O, k) : O[k])) {
			return true;
		}
		k += 1;
	}
	return false;
};
