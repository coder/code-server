'use strict';

var GetIntrinsic = require('get-intrinsic');

var $RangeError = GetIntrinsic('%RangeError%');
var $TypeError = GetIntrinsic('%TypeError%');

var assign = require('object.assign');

var isPropertyDescriptor = require('../helpers/isPropertyDescriptor');

var IsArray = require('./IsArray');
var IsAccessorDescriptor = require('./IsAccessorDescriptor');
var IsDataDescriptor = require('./IsDataDescriptor');
var OrdinaryDefineOwnProperty = require('./OrdinaryDefineOwnProperty');
var OrdinaryGetOwnProperty = require('./OrdinaryGetOwnProperty');
var ToNumber = require('./ToNumber');
var ToString = require('./ToString');
var ToUint32 = require('./ToUint32');
var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-arraysetlength

// eslint-disable-next-line max-statements, max-lines-per-function
module.exports = function ArraySetLength(A, Desc) {
	if (!IsArray(A)) {
		throw new $TypeError('Assertion failed: A must be an Array');
	}
	if (!isPropertyDescriptor({
		Type: Type,
		IsDataDescriptor: IsDataDescriptor,
		IsAccessorDescriptor: IsAccessorDescriptor
	}, Desc)) {
		throw new $TypeError('Assertion failed: Desc must be a Property Descriptor');
	}
	if (!('[[Value]]' in Desc)) {
		return OrdinaryDefineOwnProperty(A, 'length', Desc);
	}
	var newLenDesc = assign({}, Desc);
	var newLen = ToUint32(Desc['[[Value]]']);
	var numberLen = ToNumber(Desc['[[Value]]']);
	if (newLen !== numberLen) {
		throw new $RangeError('Invalid array length');
	}
	newLenDesc['[[Value]]'] = newLen;
	var oldLenDesc = OrdinaryGetOwnProperty(A, 'length');
	if (!IsDataDescriptor(oldLenDesc)) {
		throw new $TypeError('Assertion failed: an array had a non-data descriptor on `length`');
	}
	var oldLen = oldLenDesc['[[Value]]'];
	if (newLen >= oldLen) {
		return OrdinaryDefineOwnProperty(A, 'length', newLenDesc);
	}
	if (!oldLenDesc['[[Writable]]']) {
		return false;
	}
	var newWritable;
	if (!('[[Writable]]' in newLenDesc) || newLenDesc['[[Writable]]']) {
		newWritable = true;
	} else {
		newWritable = false;
		newLenDesc['[[Writable]]'] = true;
	}
	var succeeded = OrdinaryDefineOwnProperty(A, 'length', newLenDesc);
	if (!succeeded) {
		return false;
	}
	while (newLen < oldLen) {
		oldLen -= 1;
		// eslint-disable-next-line no-param-reassign
		var deleteSucceeded = delete A[ToString(oldLen)];
		if (!deleteSucceeded) {
			newLenDesc['[[Value]]'] = oldLen + 1;
			if (!newWritable) {
				newLenDesc['[[Writable]]'] = false;
				OrdinaryDefineOwnProperty(A, 'length', newLenDesc);
				return false;
			}
		}
	}
	if (!newWritable) {
		return OrdinaryDefineOwnProperty(A, 'length', { '[[Writable]]': false });
	}
	return true;
};
