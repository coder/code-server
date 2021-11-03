'use strict';

var callBound = require('call-bind/callBound');
var $arrayPush = callBound('Array.prototype.push');

var getIteratorMethod = require('../helpers/getIteratorMethod');
var AdvanceStringIndex = require('./AdvanceStringIndex');
var GetIterator = require('./GetIterator');
var GetMethod = require('./GetMethod');
var IsArray = require('./IsArray');
var IteratorStep = require('./IteratorStep');
var IteratorValue = require('./IteratorValue');
var ToObject = require('./ToObject');
var Type = require('./Type');
var ES = {
	AdvanceStringIndex: AdvanceStringIndex,
	GetMethod: GetMethod,
	IsArray: IsArray,
	Type: Type
};

// https://262.ecma-international.org/7.0/#sec-iterabletoarraylike
/**
 * 1. Let usingIterator be ? GetMethod(items, @@iterator).
 * 2. If usingIterator is not undefined, then
 *    1. Let iterator be ? GetIterator(items, usingIterator).
 *    2. Let values be a new empty List.
 *    3. Let next be true.
 *    4. Repeat, while next is not false
 *       1. Let next be ? IteratorStep(iterator).
 *       2. If next is not false, then
 *          1. Let nextValue be ? IteratorValue(next).
 *          2. Append nextValue to the end of the List values.
 *    5. Return CreateArrayFromList(values).
 * 3. NOTE: items is not an Iterable so assume it is already an array-like object.
 * 4. Return ! ToObject(items).
 */

module.exports = function IterableToArrayLike(items) {
	var usingIterator = getIteratorMethod(ES, items);
	if (typeof usingIterator !== 'undefined') {
		var iterator = GetIterator(items, usingIterator);
		var values = [];
		var next = true;
		while (next) {
			next = IteratorStep(iterator);
			if (next) {
				var nextValue = IteratorValue(next);
				$arrayPush(values, nextValue);
			}
		}
		return values;
	}

	return ToObject(items);
};
