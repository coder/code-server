'use strict';

var whichBoxedPrimitive = require('which-boxed-primitive');
var bind = require('function-bind');
var hasSymbols = require('has-symbols')();
var hasBigInts = require('has-bigints')();

var stringToString = bind.call(Function.call, String.prototype.toString);
var numberValueOf = bind.call(Function.call, Number.prototype.valueOf);
var booleanValueOf = bind.call(Function.call, Boolean.prototype.valueOf);
var symbolValueOf = hasSymbols && bind.call(Function.call, Symbol.prototype.valueOf);
var bigIntValueOf = hasBigInts && bind.call(Function.call, BigInt.prototype.valueOf);

module.exports = function unboxPrimitive(value) {
	var which = whichBoxedPrimitive(value);
	if (typeof which !== 'string') {
		throw new TypeError(which === null ? 'value is an unboxed primitive' : 'value is a non-boxed-primitive object');
	}

	if (which === 'String') {
		return stringToString(value);
	}
	if (which === 'Number') {
		return numberValueOf(value);
	}
	if (which === 'Boolean') {
		return booleanValueOf(value);
	}
	if (which === 'Symbol') {
		if (!hasSymbols) {
			throw new EvalError('somehow this environment does not have Symbols, but you have a boxed Symbol value. Please report this!');
		}
		return symbolValueOf(value);
	}
	if (which === 'BigInt') {
		return bigIntValueOf(value);
	}
	throw new RangeError('unknown boxed primitive found: ' + which);
};
