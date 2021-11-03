'use strict';

var GetIntrinsic = require('get-intrinsic');

var $ObjectCreate = GetIntrinsic('%Object.create%', true);
var $TypeError = GetIntrinsic('%TypeError%');
var $SyntaxError = GetIntrinsic('%SyntaxError%');

var Type = require('./Type');

var hasProto = !({ __proto__: null } instanceof Object);

// https://ecma-international.org/ecma-262/6.0/#sec-objectcreate

module.exports = function ObjectCreate(proto, internalSlotsList) {
	if (proto !== null && Type(proto) !== 'Object') {
		throw new $TypeError('Assertion failed: `proto` must be null or an object');
	}
	var slots = arguments.length < 2 ? [] : internalSlotsList;
	if (slots.length > 0) {
		throw new $SyntaxError('es-abstract does not yet support internal slots');
	}

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
