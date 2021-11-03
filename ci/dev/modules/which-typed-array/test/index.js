'use strict';

var test = require('tape');
var whichTypedArray = require('../');
var isCallable = require('is-callable');
var hasSymbols = typeof Symbol === 'function' && typeof Symbol('foo') === 'symbol';
var generators = require('make-generator-function')();
var arrows = require('make-arrow-function').list();
var forEach = require('foreach');

var typedArrayNames = [
	'Int8Array',
	'Uint8Array',
	'Uint8ClampedArray',
	'Int16Array',
	'Uint16Array',
	'Int32Array',
	'Uint32Array',
	'Float32Array',
	'Float64Array',
	'BigInt64Array',
	'BigUint64Array'
];

test('not arrays', function (t) {
	t.test('non-number/string primitives', function (st) {
		st.equal(false, whichTypedArray(), 'undefined is not typed array');
		st.equal(false, whichTypedArray(null), 'null is not typed array');
		st.equal(false, whichTypedArray(false), 'false is not typed array');
		st.equal(false, whichTypedArray(true), 'true is not typed array');
		st.end();
	});

	t.equal(false, whichTypedArray({}), 'object is not typed array');
	t.equal(false, whichTypedArray(/a/g), 'regex literal is not typed array');
	t.equal(false, whichTypedArray(new RegExp('a', 'g')), 'regex object is not typed array');
	t.equal(false, whichTypedArray(new Date()), 'new Date() is not typed array');

	t.test('numbers', function (st) {
		st.equal(false, whichTypedArray(42), 'number is not typed array');
		st.equal(false, whichTypedArray(Object(42)), 'number object is not typed array');
		st.equal(false, whichTypedArray(NaN), 'NaN is not typed array');
		st.equal(false, whichTypedArray(Infinity), 'Infinity is not typed array');
		st.end();
	});

	t.test('strings', function (st) {
		st.equal(false, whichTypedArray('foo'), 'string primitive is not typed array');
		st.equal(false, whichTypedArray(Object('foo')), 'string object is not typed array');
		st.end();
	});

	t.end();
});

test('Functions', function (t) {
	t.equal(false, whichTypedArray(function () {}), 'function is not typed array');
	t.end();
});

test('Generators', { skip: generators.length === 0 }, function (t) {
	forEach(generators, function (genFn) {
		t.equal(false, whichTypedArray(genFn), 'generator function ' + genFn + ' is not typed array');
	});
	t.end();
});

test('Arrow functions', { skip: arrows.length === 0 }, function (t) {
	forEach(arrows, function (arrowFn) {
		t.equal(false, whichTypedArray(arrowFn), 'arrow function ' + arrowFn + ' is not typed array');
	});
	t.end();
});

test('@@toStringTag', { skip: !hasSymbols || !Symbol.toStringTag }, function (t) {
	forEach(typedArrayNames, function (typedArray) {
		if (typeof global[typedArray] === 'function') {
			var fakeTypedArray = [];
			fakeTypedArray[Symbol.toStringTag] = typedArray;
			t.equal(false, whichTypedArray(fakeTypedArray), 'faked ' + typedArray + ' is not typed array');
		} else {
			t.comment('# SKIP ' + typedArray + ' is not supported');
		}
	});
	t.end();
});

test('Typed Arrays', function (t) {
	forEach(typedArrayNames, function (typedArray) {
		var TypedArray = global[typedArray];
		if (isCallable(TypedArray)) {
			var arr = new TypedArray(10);
			t.equal(typedArray, whichTypedArray(arr), 'new ' + typedArray + '(10) is typed array of type ' + typedArray);
		} else {
			t.comment('# SKIP ' + typedArray + ' is not supported');
		}
	});
	t.end();
});
