'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var callBound = require('call-bind/callBound');

var $SymbolToString = callBound('Symbol.prototype.toString', true);

var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-symboldescriptivestring

module.exports = function SymbolDescriptiveString(sym) {
	if (Type(sym) !== 'Symbol') {
		throw new $TypeError('Assertion failed: `sym` must be a Symbol');
	}
	return $SymbolToString(sym);
};
