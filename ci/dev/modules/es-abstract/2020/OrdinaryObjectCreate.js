'use strict';

var GetIntrinsic = require('get-intrinsic');

var $ObjectCreate = GetIntrinsic('%Object.create%', true);
var $TypeError = GetIntrinsic('%TypeError%');
var $SyntaxError = GetIntrinsic('%SyntaxError%');

var IsArray = require('./IsArray');
var Type = require('./Type');

var hasProto = !({ __proto__: null } instanceof Object);

// https://262.ecma-international.org/6.0/#sec-objectcreate

module.exports = function OrdinaryObjectCreate(proto) {
	if (proto !== null && Type(proto) !== 'Object') {
		throw new $TypeError('Assertion failed: `proto` must be null or an object');
	}
	var additionalInternalSlotsList = arguments.length < 2 ? [] : arguments[1];
	if (!IsArray(additionalInternalSlotsList)) {
		throw new $TypeError('Assertion failed: `additionalInternalSlotsList` must be an Array');
	}
	// var internalSlotsList = ['[[Prototype]]', '[[Extensible]]'];
	if (additionalInternalSlotsList.length > 0) {
		throw new $SyntaxError('es-abstract does not yet support internal slots');
		// internalSlotsList.push(...additionalInternalSlotsList);
	}
	// var O = MakeBasicObject(internalSlotsList);
	// setProto(O, proto);
	// return O;

	if ($ObjectCreate) {
		return $ObjectCreate(proto);
	}
	if (hasProto) {
		return { __proto__: proto };
	}

	if (proto === null) {
		throw new $SyntaxError('native Object.create support is required to create null objects');
	}
	var T = function T() {};
	T.prototype = proto;
	return new T();
};
