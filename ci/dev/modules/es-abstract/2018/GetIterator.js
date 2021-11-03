'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var getIteratorMethod = require('../helpers/getIteratorMethod');
var AdvanceStringIndex = require('./AdvanceStringIndex');
var Call = require('./Call');
var GetMethod = require('./GetMethod');
var IsArray = require('./IsArray');
var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-getiterator

module.exports = function GetIterator(obj, method) {
	var actualMethod = method;
	if (arguments.length < 2) {
		actualMethod = getIteratorMethod(
			{
				AdvanceStringIndex: AdvanceStringIndex,
				GetMethod: GetMethod,
				IsArray: IsArray,
				Type: Type
			},
			obj
		);
	}
	var iterator = Call(actualMethod, obj);
	if (Type(iterator) !== 'Object') {
		throw new $TypeError('iterator must return an object');
	}

	return iterator;
};
