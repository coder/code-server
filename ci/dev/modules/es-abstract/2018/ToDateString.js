'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');
var $Date = GetIntrinsic('%Date%');

var $isNaN = require('../helpers/isNaN');

var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-todatestring

module.exports = function ToDateString(tv) {
	if (Type(tv) !== 'Number') {
		throw new $TypeError('Assertion failed: `tv` must be a Number');
	}
	if ($isNaN(tv)) {
		return 'Invalid Date';
	}
	return $Date(tv);
};
