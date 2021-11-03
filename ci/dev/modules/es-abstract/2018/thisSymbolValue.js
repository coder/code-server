'use strict';

var callBound = require('call-bind/callBound');

var $SymbolValueOf = callBound('Symbol.prototype.valueOf', true);

var Type = require('./Type');

// https://262.ecma-international.org/9.0/#sec-thissymbolvalue

module.exports = function thisSymbolValue(value) {
	if (!$SymbolValueOf) {
		throw new SyntaxError('Symbols are not supported; thisSymbolValue requires that `value` be a Symbol or a Symbol object');
	}
	if (Type(value) === 'Symbol') {
		return value;
	}
	return $SymbolValueOf(value);
};
