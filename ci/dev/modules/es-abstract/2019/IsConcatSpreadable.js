'use strict';

var GetIntrinsic = require('get-intrinsic');

var $isConcatSpreadable = GetIntrinsic('%Symbol.isConcatSpreadable%', true);

var Get = require('./Get');
var IsArray = require('./IsArray');
var ToBoolean = require('./ToBoolean');
var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-isconcatspreadable

module.exports = function IsConcatSpreadable(O) {
	if (Type(O) !== 'Object') {
		return false;
	}
	if ($isConcatSpreadable) {
		var spreadable = Get(O, $isConcatSpreadable);
		if (typeof spreadable !== 'undefined') {
			return ToBoolean(spreadable);
		}
	}
	return IsArray(O);
};
