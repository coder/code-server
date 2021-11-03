'use strict';

var GetIntrinsic = require('get-intrinsic');

var $SyntaxError = GetIntrinsic('%SyntaxError%');
var $TypeError = GetIntrinsic('%TypeError%');
var $preventExtensions = GetIntrinsic('%Object.preventExtensions%');
var $gOPD = require('../helpers/getOwnPropertyDescriptor');
var $gOPN = GetIntrinsic('%Object.getOwnPropertyNames%');

var forEach = require('../helpers/forEach');

var DefinePropertyOrThrow = require('./DefinePropertyOrThrow');
var IsAccessorDescriptor = require('./IsAccessorDescriptor');
var ToPropertyDescriptor = require('./ToPropertyDescriptor');
var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-setintegritylevel

module.exports = function SetIntegrityLevel(O, level) {
	if (Type(O) !== 'Object') {
		throw new $TypeError('Assertion failed: Type(O) is not Object');
	}
	if (level !== 'sealed' && level !== 'frozen') {
		throw new $TypeError('Assertion failed: `level` must be `"sealed"` or `"frozen"`');
	}
	if (!$preventExtensions) {
		throw new $SyntaxError('SetIntegrityLevel requires native `Object.preventExtensions` support');
	}
	var status = $preventExtensions(O);
	if (!status) {
		return false;
	}
	if (!$gOPN) {
		throw new $SyntaxError('SetIntegrityLevel requires native `Object.getOwnPropertyNames` support');
	}
	var theKeys = $gOPN(O);
	if (level === 'sealed') {
		forEach(theKeys, function (k) {
			DefinePropertyOrThrow(O, k, { configurable: false });
		});
	} else if (level === 'frozen') {
		forEach(theKeys, function (k) {
			var currentDesc = $gOPD(O, k);
			if (typeof currentDesc !== 'undefined') {
				var desc;
				if (IsAccessorDescriptor(ToPropertyDescriptor(currentDesc))) {
					desc = { configurable: false };
				} else {
					desc = { configurable: false, writable: false };
				}
				DefinePropertyOrThrow(O, k, desc);
			}
		});
	}
	return true;
};
