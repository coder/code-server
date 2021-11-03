'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Get = require('./Get');
var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-iteratorvalue

module.exports = function IteratorValue(iterResult) {
	if (Type(iterResult) !== 'Object') {
		throw new $TypeError('Assertion failed: Type(iterResult) is not Object');
	}
	return Get(iterResult, 'value');
};

