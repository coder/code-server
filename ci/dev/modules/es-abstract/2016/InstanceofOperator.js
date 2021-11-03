'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var $hasInstance = GetIntrinsic('Symbol.hasInstance', true);

var Call = require('./Call');
var GetMethod = require('./GetMethod');
var IsCallable = require('./IsCallable');
var OrdinaryHasInstance = require('./OrdinaryHasInstance');
var ToBoolean = require('./ToBoolean');
var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-instanceofoperator

module.exports = function InstanceofOperator(O, C) {
	if (Type(O) !== 'Object') {
		throw new $TypeError('Assertion failed: Type(O) is not Object');
	}
	var instOfHandler = $hasInstance ? GetMethod(C, $hasInstance) : void 0;
	if (typeof instOfHandler !== 'undefined') {
		return ToBoolean(Call(instOfHandler, C, [O]));
	}
	if (!IsCallable(C)) {
		throw new $TypeError('`C` is not Callable');
	}
	return OrdinaryHasInstance(C, O);
};
