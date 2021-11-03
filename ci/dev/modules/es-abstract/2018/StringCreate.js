'use strict';

var GetIntrinsic = require('get-intrinsic');

var $Object = GetIntrinsic('%Object%');
var $StringPrototype = GetIntrinsic('%String.prototype%');
var $SyntaxError = GetIntrinsic('%SyntaxError%');
var $TypeError = GetIntrinsic('%TypeError%');

var DefinePropertyOrThrow = require('./DefinePropertyOrThrow');
var Type = require('./Type');

var setProto = require('../helpers/setProto');

// https://262.ecma-international.org/6.0/#sec-stringcreate

module.exports = function StringCreate(value, prototype) {
	if (Type(value) !== 'String') {
		throw new $TypeError('Assertion failed: `S` must be a String');
	}

	var S = $Object(value);
	if (S !== $StringPrototype) {
		if (setProto) {
			setProto(S, prototype);
		} else {
			throw new $SyntaxError('StringCreate: a `proto` argument that is not `String.prototype` is not supported in an environment that does not support setting the [[Prototype]]');
		}
	}

	var length = value.length;
	DefinePropertyOrThrow(S, 'length', {
		'[[Configurable]]': false,
		'[[Enumerable]]': false,
		'[[Value]]': length,
		'[[Writable]]': false
	});

	return S;
};
