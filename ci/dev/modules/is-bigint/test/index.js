'use strict';

var test = require('tape');
var inspect = require('object-inspect');
var isBigInt = require('..');

var debug = function (v, m) { return inspect(v) + ' ' + m; };

var forEach = function (arr, func) {
	var i;
	for (i = 0; i < arr.length; ++i) {
		func(arr[i], i, arr);
	}
};

var hasSymbols = require('has-symbols')();
var hasBigInts = typeof BigInt === 'function';

test('non-BigInt values', function (t) {
	var nonBigInts = [
		true,
		false,
		Object(true),
		Object(false),
		null,
		undefined,
		{},
		[],
		/a/g,
		'string',
		42,
		new Date(),
		function () {},
		NaN
	];
	if (hasSymbols) {
		nonBigInts.push(Symbol.iterator, Symbol('foo'));
	}
	t.plan(nonBigInts.length);
	forEach(nonBigInts, function (nonBigInt) {
		t.equal(false, isBigInt(nonBigInt), debug(nonBigInt, 'is not a BigInt'));
	});
	t.end();
});

test('faked BigInt values', function (t) {
	t.test('real BigInt valueOf', { skip: !hasBigInts }, function (st) {
		var fakeBigInt = { valueOf: function () { return BigInt(42); } };
		st.equal(false, isBigInt(fakeBigInt), 'object with valueOf returning a BigInt is not a BigInt');
		st.end();
	});

	t.test('faked @@toStringTag', { skip: !hasBigInts || !hasSymbols || !Symbol.toStringTag }, function (st) {
		var fakeBigInt = { valueOf: function () { return BigInt(42); } };
		fakeBigInt[Symbol.toStringTag] = 'BigInt';
		st.equal(false, isBigInt(fakeBigInt), 'object with fake BigInt @@toStringTag and valueOf returning a BigInt is not a BigInt');

		var notSoFakeBigInt = { valueOf: function () { return 42; } };
		notSoFakeBigInt[Symbol.toStringTag] = 'BigInt';
		st.equal(false, isBigInt(notSoFakeBigInt), 'object with fake BigInt @@toStringTag and valueOf not returning a BigInt is not a BigInt');
		st.end();
	});

	var fakeBigIntString = { toString: function () { return '42n'; } };
	t.equal(false, isBigInt(fakeBigIntString), 'object with toString returning 42n is not a BigInt');

	t.end();
});

test('BigInt support', { skip: !hasBigInts }, function (t) {
	forEach([
		Function('return 42n')(), // eslint-disable-line no-new-func
		BigInt(42),
		Object(BigInt(42))
	], function (bigInt) {
		t.equal(true, isBigInt(bigInt), debug(bigInt, 'is a BigInt'));
	});

	t.end();
});
