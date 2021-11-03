'use strict';

var GetIntrinsic = require('get-intrinsic');

var $ArrayPrototype = GetIntrinsic('%Array.prototype%');
var $RangeError = GetIntrinsic('%RangeError%');
var $SyntaxError = GetIntrinsic('%SyntaxError%');
var $TypeError = GetIntrinsic('%TypeError%');

var IsInteger = require('./IsInteger');

var MAX_ARRAY_LENGTH = Math.pow(2, 32) - 1;

var $setProto = GetIntrinsic('%Object.setPrototypeOf%', true) || (
	// eslint-disable-next-line no-proto, no-negated-condition
	[].__proto__ !== $ArrayPrototype
		? null
		: function (O, proto) {
			O.__proto__ = proto; // eslint-disable-line no-proto, no-param-reassign
			return O;
		}
);

// https://ecma-international.org/ecma-262/6.0/#sec-arraycreate

module.exports = function ArrayCreate(length) {
	if (!IsInteger(length) || length < 0) {
		throw new $TypeError('Assertion failed: `length` must be an integer Number >= 0');
	}
	if (length > MAX_ARRAY_LENGTH) {
		throw new $RangeError('length is greater than (2**32 - 1)');
	}
	var proto = arguments.length > 1 ? arguments[1] : $ArrayPrototype;
	var A = []; // steps 5 - 7, and 9
	if (proto !== $ArrayPrototype) { // step 8
		if (!$setProto) {
			throw new $SyntaxError('ArrayCreate: a `proto` argument that is not `Array.prototype` is not supported in an environment that does not support setting the [[Prototype]]');
		}
		$setProto(A, proto);
	}
	if (length !== 0) { // bypasses the need for step 2
		A.length = length;
	}
	/* step 10, the above as a shortcut for the below
    OrdinaryDefineOwnProperty(A, 'length', {
        '[[Configurable]]': false,
        '[[Enumerable]]': false,
        '[[Value]]': length,
        '[[Writable]]': true
    });
    */
	return A;
};
