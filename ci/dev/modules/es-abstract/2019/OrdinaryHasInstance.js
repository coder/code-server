'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Get = require('./Get');
var IsCallable = require('./IsCallable');
var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-ordinaryhasinstance

module.exports = function OrdinaryHasInstance(C, O) {
	if (IsCallable(C) === false) {
		return false;
	}
	if (Type(O) !== 'Object') {
		return false;
	}
	var P = Get(C, 'prototype');
	if (Type(P) !== 'Object') {
		throw new $TypeError('OrdinaryHasInstance called on an object with an invalid prototype property.');
	}
	return O instanceof C;
};
