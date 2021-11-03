'use strict';

var tape = require('tape');

var forEach = require('foreach');
var debug = require('object-inspect');
var assign = require('object.assign');
var keys = require('object-keys');
var has = require('has');
var arrowFns = require('make-arrow-function').list();
var hasStrictMode = require('has-strict-mode')();
var functionsHaveNames = require('functions-have-names')();
var functionsHaveConfigurableNames = require('functions-have-names').functionsHaveConfigurableNames();
var hasBigInts = require('has-bigints')();

var $getProto = require('../helpers/getProto');
var $setProto = require('../helpers/setProto');
var defineProperty = require('./helpers/defineProperty');
var getInferredName = require('../helpers/getInferredName');
var getOwnPropertyDescriptor = require('../helpers/getOwnPropertyDescriptor');
var assertRecordTests = require('./helpers/assertRecord');
var v = require('es-value-fixtures');
var diffOps = require('./diffOps');

var $BigInt = hasBigInts ? BigInt : null;

var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;

var canDistinguishSparseFromUndefined = 0 in [undefined]; // IE 6 - 8 have a bug where this returns false

// IE 9 does not throw in strict mode when writability/configurability/extensibility is violated
var noThrowOnStrictViolation = (function () {
	try {
		delete [].length;
		return true;
	} catch (e) {
	}
	return false;
}());

var makeTest = function makeTest(skips) {
	return function test(opName, maybeOpts, maybeCb) {
		var origOpts = arguments.length > 2 ? maybeOpts : {};
		var opts = assign(
			{},
			origOpts,
			{ skip: (skips && skips[opName]) || origOpts.skip }
		);
		var cb = arguments.length > 2 ? maybeCb : maybeOpts;
		return tape(opName, opts, cb);
	};
};

var leadingPoo = '\uD83D';
var trailingPoo = '\uDCA9';
var wholePoo = leadingPoo + trailingPoo;

var getArraySubclassWithSpeciesConstructor = function getArraySubclass(speciesConstructor) {
	var Bar = function Bar() {
		var inst = [];
		Object.setPrototypeOf(inst, Bar.prototype);
		defineProperty(inst, 'constructor', { value: Bar });
		return inst;
	};
	Bar.prototype = Object.create(Array.prototype);
	Object.setPrototypeOf(Bar, Array);
	defineProperty(Bar, Symbol.species, { value: speciesConstructor });

	return Bar;
};

var testIterator = function (t, iterator, expected) {
	var resultCount = 0;
	var result;
	while (result = iterator.next(), !result.done) { // eslint-disable-line no-sequences
		t.deepEqual(result, { done: false, value: expected[resultCount] }, 'result ' + resultCount);
		resultCount += 1;
	}
	t.equal(resultCount, expected.length, 'expected ' + expected.length + ', got ' + resultCount);
};

var hasSpecies = v.hasSymbols && Symbol.species;

var hasLastIndex = 'lastIndex' in (/a/).exec('a'); // IE 8
var hasGroups = 'groups' in (/a/).exec('a'); // modern engines
var kludgeMatch = function kludgeMatch(R, matchObject) {
	if (hasGroups) {
		assign(matchObject, { groups: matchObject.groups });
	}
	if (hasLastIndex) {
		assign(matchObject, { lastIndex: R.lastIndex });
	}
	return matchObject;
};

var testEnumerableOwnNames = function (t, enumerableOwnNames) {
	forEach(v.primitives, function (nonObject) {
		t['throws'](
			function () { enumerableOwnNames(nonObject); },
			debug(nonObject) + ' is not an Object'
		);
	});

	var Child = function Child() {
		this.own = {};
	};
	Child.prototype = {
		inherited: {}
	};

	var obj = new Child();

	t.equal('own' in obj, true, 'has "own"');
	t.equal(has(obj, 'own'), true, 'has own "own"');
	t.equal(Object.prototype.propertyIsEnumerable.call(obj, 'own'), true, 'has enumerable "own"');

	t.equal('inherited' in obj, true, 'has "inherited"');
	t.equal(has(obj, 'inherited'), false, 'has non-own "inherited"');
	t.equal(has(Child.prototype, 'inherited'), true, 'Child.prototype has own "inherited"');
	t.equal(Child.prototype.inherited, obj.inherited, 'Child.prototype.inherited === obj.inherited');
	t.equal(Object.prototype.propertyIsEnumerable.call(Child.prototype, 'inherited'), true, 'has enumerable "inherited"');

	t.equal('toString' in obj, true, 'has "toString"');
	t.equal(has(obj, 'toString'), false, 'has non-own "toString"');
	t.equal(has(Object.prototype, 'toString'), true, 'Object.prototype has own "toString"');
	t.equal(Object.prototype.toString, obj.toString, 'Object.prototype.toString === obj.toString');
	// eslint-disable-next-line no-useless-call
	t.equal(Object.prototype.propertyIsEnumerable.call(Object.prototype, 'toString'), false, 'has non-enumerable "toString"');

	return obj;
};

var testToNumber = function (t, ES, ToNumber) {
	t.equal(NaN, ToNumber(undefined), 'undefined coerces to NaN');
	t.equal(ToNumber(null), 0, 'null coerces to +0');
	t.equal(ToNumber(false), 0, 'false coerces to +0');
	t.equal(1, ToNumber(true), 'true coerces to 1');

	t.test('numbers', function (st) {
		st.equal(NaN, ToNumber(NaN), 'NaN returns itself');
		forEach(v.zeroes.concat(v.infinities, 42), function (num) {
			st.equal(num, ToNumber(num), num + ' returns itself');
		});
		forEach(['foo', '0', '4a', '2.0', 'Infinity', '-Infinity'], function (numString) {
			st.equal(+numString, ToNumber(numString), '"' + numString + '" coerces to ' + Number(numString));
		});
		st.end();
	});

	t.test('objects', function (st) {
		forEach(v.objects, function (object) {
			st.equal(ToNumber(object), ToNumber(ES.ToPrimitive(object)), 'object ' + object + ' coerces to same as ToPrimitive of object does');
		});
		st['throws'](function () { return ToNumber(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws');
		st.end();
	});

	// TODO: check if this applies to ES5
	t.test('binary literals', function (st) {
		st.equal(ToNumber('0b10'), 2, '0b10 is 2');
		st.equal(ToNumber({ toString: function () { return '0b11'; } }), 3, 'Object that toStrings to 0b11 is 3');

		st.equal(ToNumber('0b12'), NaN, '0b12 is NaN');
		st.equal(ToNumber({ toString: function () { return '0b112'; } }), NaN, 'Object that toStrings to 0b112 is NaN');
		st.end();
	});

	// TODO: check if this applies to ES5
	t.test('octal literals', function (st) {
		st.equal(ToNumber('0o10'), 8, '0o10 is 8');
		st.equal(ToNumber({ toString: function () { return '0o11'; } }), 9, 'Object that toStrings to 0o11 is 9');

		st.equal(ToNumber('0o18'), NaN, '0o18 is NaN');
		st.equal(ToNumber({ toString: function () { return '0o118'; } }), NaN, 'Object that toStrings to 0o118 is NaN');
		st.end();
	});

	// TODO: check if this applies to ES5
	t.test('signed hex numbers', function (st) {
		st.equal(ToNumber('-0xF'), NaN, '-0xF is NaN');
		st.equal(ToNumber(' -0xF '), NaN, 'space-padded -0xF is NaN');
		st.equal(ToNumber('+0xF'), NaN, '+0xF is NaN');
		st.equal(ToNumber(' +0xF '), NaN, 'space-padded +0xF is NaN');

		st.end();
	});

	// TODO: check if this applies to ES5
	t.test('trimming of whitespace and non-whitespace characters', function (st) {
		var whitespace = ' \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000';
		st.equal(0, ToNumber(whitespace + 0 + whitespace), 'whitespace is trimmed');

		// Zero-width space (zws), next line character (nel), and non-character (bom) are not whitespace.
		var nonWhitespaces = {
			'\\u0085': '\u0085',
			'\\u200b': '\u200b',
			'\\ufffe': '\ufffe'
		};

		forEach(nonWhitespaces, function (desc, nonWS) {
			st.equal(ToNumber(nonWS + 0 + nonWS), NaN, 'non-whitespace ' + desc + ' not trimmed');
		});

		st.end();
	});

	// TODO: skip for ES5
	forEach(v.symbols, function (symbol) {
		t['throws'](
			function () { ToNumber(symbol); },
			TypeError,
			'Symbols can’t be converted to a Number: ' + debug(symbol)
		);
	});

	// TODO: check if this applies to ES5
	t.test('dates', function (st) {
		var invalid = new Date(NaN);
		st.equal(ToNumber(invalid), NaN, 'invalid Date coerces to NaN');
		var now = +new Date();
		st.equal(ToNumber(new Date(now)), now, 'Date coerces to timestamp');
		st.end();
	});
};

var es5 = function ES5(ES, ops, expectedMissing, skips) {
	var test = makeTest(skips);

	test('has expected operations', function (t) {
		var diff = diffOps(ES, ops, expectedMissing);

		t.deepEqual(diff.extra, [], 'no extra ops');

		t.deepEqual(diff.missing, [], 'no unexpected missing ops');

		t.deepEqual(diff.extraMissing, [], 'no unexpected "expected missing" ops');

		t.end();
	});

	test('ToPrimitive', function (t) {
		t.test('primitives', function (st) {
			var testPrimitive = function (primitive) {
				st.equal(ES.ToPrimitive(primitive), primitive, debug(primitive) + ' is returned correctly');
			};
			forEach(v.primitives, testPrimitive);
			st.end();
		});

		t.test('objects', function (st) {
			st.equal(ES.ToPrimitive(v.coercibleObject), 3, 'coercibleObject with no hint coerces to valueOf');
			st.equal(ES.ToPrimitive({}), '[object Object]', '{} with no hint coerces to Object#toString');
			st.equal(ES.ToPrimitive(v.coercibleObject, Number), 3, 'coercibleObject with hint Number coerces to valueOf');
			st.equal(ES.ToPrimitive({}, Number), '[object Object]', '{} with hint Number coerces to NaN');
			st.equal(ES.ToPrimitive(v.coercibleObject, String), 42, 'coercibleObject with hint String coerces to nonstringified toString');
			st.equal(ES.ToPrimitive({}, String), '[object Object]', '{} with hint String coerces to Object#toString');
			st.equal(ES.ToPrimitive(v.coercibleFnObject), v.coercibleFnObject.toString(), 'coercibleFnObject coerces to toString');
			st.equal(ES.ToPrimitive(v.toStringOnlyObject), 7, 'toStringOnlyObject returns non-stringified toString');
			st.equal(ES.ToPrimitive(v.valueOfOnlyObject), 4, 'valueOfOnlyObject returns valueOf');
			st['throws'](function () { return ES.ToPrimitive(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws a TypeError');
			st['throws'](function () { return ES.ToPrimitive(v.uncoercibleFnObject); }, TypeError, 'uncoercibleFnObject throws a TypeError');
			st.end();
		});

		t.test('dates', function (st) {
			var invalid = new Date(NaN);
			st.equal(ES.ToPrimitive(invalid), Date.prototype.toString.call(invalid), 'invalid Date coerces to Date#toString');
			var now = new Date();
			st.equal(ES.ToPrimitive(now), Date.prototype.toString.call(now), 'Date coerces to Date#toString');
			st.end();
		});

		t.end();
	});

	test('ToBoolean', function (t) {
		t.equal(false, ES.ToBoolean(undefined), 'undefined coerces to false');
		t.equal(false, ES.ToBoolean(null), 'null coerces to false');
		t.equal(false, ES.ToBoolean(false), 'false returns false');
		t.equal(true, ES.ToBoolean(true), 'true returns true');

		t.test('numbers', function (st) {
			forEach(v.zeroes.concat(NaN), function (falsyNumber) {
				st.equal(false, ES.ToBoolean(falsyNumber), 'falsy number ' + falsyNumber + ' coerces to false');
			});
			forEach(v.infinities.concat([42, 1]), function (truthyNumber) {
				st.equal(true, ES.ToBoolean(truthyNumber), 'truthy number ' + truthyNumber + ' coerces to true');
			});

			st.end();
		});

		t.equal(false, ES.ToBoolean(''), 'empty string coerces to false');
		t.equal(true, ES.ToBoolean('foo'), 'nonempty string coerces to true');

		t.test('objects', function (st) {
			forEach(v.objects, function (obj) {
				st.equal(true, ES.ToBoolean(obj), 'object coerces to true');
			});
			st.equal(true, ES.ToBoolean(v.uncoercibleObject), 'uncoercibleObject coerces to true');

			st.end();
		});

		t.end();
	});

	test('ToNumber', function (t) {
		t.equal(NaN, ES.ToNumber(undefined), 'undefined coerces to NaN');
		t.equal(ES.ToNumber(null), 0, 'null coerces to +0');
		t.equal(ES.ToNumber(false), 0, 'false coerces to +0');
		t.equal(1, ES.ToNumber(true), 'true coerces to 1');

		t.test('numbers', function (st) {
			st.equal(NaN, ES.ToNumber(NaN), 'NaN returns itself');
			forEach(v.zeroes.concat(v.infinities, 42), function (num) {
				st.equal(num, ES.ToNumber(num), num + ' returns itself');
			});
			forEach(['foo', '0', '4a', '2.0', 'Infinity', '-Infinity'], function (numString) {
				st.equal(+numString, ES.ToNumber(numString), '"' + numString + '" coerces to ' + Number(numString));
			});
			st.end();
		});

		t.test('objects', function (st) {
			forEach(v.objects, function (object) {
				st.equal(ES.ToNumber(object), ES.ToNumber(ES.ToPrimitive(object)), 'object ' + object + ' coerces to same as ToPrimitive of object does');
			});
			st['throws'](function () { return ES.ToNumber(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws');
			st.end();
		});

		t.test('binary literals', function (st) {
			st.equal(ES.ToNumber('0b10'), NaN, '0b10 is NaN');
			st.equal(ES.ToNumber({ toString: function () { return '0b11'; } }), NaN, 'Object that toStrings to 0b11 is NaN');

			st.equal(ES.ToNumber('0b12'), NaN, '0b12 is NaN');
			st.equal(ES.ToNumber({ toString: function () { return '0b112'; } }), NaN, 'Object that toStrings to 0b112 is NaN');
			st.end();
		});

		t.test('octal literals', function (st) {
			st.equal(ES.ToNumber('0o10'), NaN, '0o10 is NaN');
			st.equal(ES.ToNumber({ toString: function () { return '0o11'; } }), NaN, 'Object that toStrings to 0o11 is NaN');

			st.equal(ES.ToNumber('0o18'), NaN, '0o18 is NaN');
			st.equal(ES.ToNumber({ toString: function () { return '0o118'; } }), NaN, 'Object that toStrings to 0o118 is NaN');
			st.end();
		});

		t.test('signed hex numbers', function (st) {
			st.equal(ES.ToNumber('-0xF'), NaN, '-0xF is NaN');
			st.equal(ES.ToNumber(' -0xF '), NaN, 'space-padded -0xF is NaN');
			st.equal(ES.ToNumber('+0xF'), NaN, '+0xF is NaN');
			st.equal(ES.ToNumber(' +0xF '), NaN, 'space-padded +0xF is NaN');

			st.end();
		});

		// TODO: check if this applies to ES5
		t.test('trimming of whitespace and non-whitespace characters', function (st) {
			var whitespace = ' \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u0085';
			st.equal(ES.ToNumber(whitespace + 0 + whitespace), 0, 'whitespace is trimmed');

			// Zero-width space (zws), next line character (nel), and non-character (bom) are not whitespace.
			var nonWhitespaces = {
				'\\u200b': '\u200b',
				'\\ufffe': '\ufffe'
			};

			forEach(nonWhitespaces, function (desc, nonWS) {
				st.equal(ES.ToNumber(nonWS + 0 + nonWS), NaN, 'non-whitespace ' + desc + ' not trimmed');
			});

			st.end();
		});

		t.test('dates', function (st) {
			var invalid = new Date(NaN);
			st.equal(ES.ToNumber(invalid), NaN, 'invalid Date coerces to NaN');
			var now = +new Date();
			st.equal(ES.ToNumber(new Date(now)), now, 'Date coerces to timestamp');
			st.end();
		});

		t.end();
	});

	test('ToInteger', function (t) {
		forEach([NaN], function (num) {
			t.equal(0, ES.ToInteger(num), debug(num) + ' returns +0');
		});
		forEach(v.zeroes.concat(v.infinities, 42), function (num) {
			t.equal(num, ES.ToInteger(num), debug(num) + ' returns itself');
			t.equal(-num, ES.ToInteger(-num), '-' + debug(num) + ' returns itself');
		});
		t.equal(3, ES.ToInteger(Math.PI), 'pi returns 3');
		t['throws'](function () { return ES.ToInteger(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws');
		t.end();
	});

	test('ToInt32', function (t) {
		t.equal(ES.ToInt32(NaN), 0, 'NaN coerces to +0');
		forEach(v.zeroes.concat(v.infinities), function (num) {
			t.equal(ES.ToInt32(num), 0, num + ' returns +0');
			t.equal(ES.ToInt32(-num), 0, '-' + num + ' returns +0');
		});
		t['throws'](function () { return ES.ToInt32(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws');
		t.equal(ES.ToInt32(0x100000000), 0, '2^32 returns +0');
		t.equal(ES.ToInt32(0x100000000 - 1), -1, '2^32 - 1 returns -1');
		t.equal(ES.ToInt32(0x80000000), -0x80000000, '2^31 returns -2^31');
		t.equal(ES.ToInt32(0x80000000 - 1), 0x80000000 - 1, '2^31 - 1 returns 2^31 - 1');
		forEach([0, Infinity, NaN, 0x100000000, 0x80000000, 0x10000, 0x42], function (num) {
			t.equal(ES.ToInt32(num), ES.ToInt32(ES.ToUint32(num)), 'ToInt32(x) === ToInt32(ToUint32(x)) for 0x' + num.toString(16));
			t.equal(ES.ToInt32(-num), ES.ToInt32(ES.ToUint32(-num)), 'ToInt32(x) === ToInt32(ToUint32(x)) for -0x' + num.toString(16));
		});
		t.end();
	});

	test('ToUint32', function (t) {
		t.equal(0, ES.ToUint32(NaN), 'NaN coerces to +0');
		forEach([0, Infinity], function (num) {
			t.equal(0, ES.ToUint32(num), num + ' returns +0');
			t.equal(0, ES.ToUint32(-num), '-' + num + ' returns +0');
		});
		t['throws'](function () { return ES.ToUint32(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws');
		t.equal(ES.ToUint32(0x100000000), 0, '2^32 returns +0');
		t.equal(ES.ToUint32(0x100000000 - 1), 0x100000000 - 1, '2^32 - 1 returns 2^32 - 1');
		t.equal(ES.ToUint32(0x80000000), 0x80000000, '2^31 returns 2^31');
		t.equal(ES.ToUint32(0x80000000 - 1), 0x80000000 - 1, '2^31 - 1 returns 2^31 - 1');
		forEach([0, Infinity, NaN, 0x100000000, 0x80000000, 0x10000, 0x42], function (num) {
			t.equal(ES.ToUint32(num), ES.ToUint32(ES.ToInt32(num)), 'ToUint32(x) === ToUint32(ToInt32(x)) for 0x' + num.toString(16));
			t.equal(ES.ToUint32(-num), ES.ToUint32(ES.ToInt32(-num)), 'ToUint32(x) === ToUint32(ToInt32(x)) for -0x' + num.toString(16));
		});
		t.end();
	});

	test('ToUint16', function (t) {
		t.equal(0, ES.ToUint16(NaN), 'NaN coerces to +0');
		forEach([0, Infinity], function (num) {
			t.equal(0, ES.ToUint16(num), num + ' returns +0');
			t.equal(0, ES.ToUint16(-num), '-' + num + ' returns +0');
		});
		t['throws'](function () { return ES.ToUint16(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws');
		t.equal(ES.ToUint16(0x100000000), 0, '2^32 returns +0');
		t.equal(ES.ToUint16(0x100000000 - 1), 0x10000 - 1, '2^32 - 1 returns 2^16 - 1');
		t.equal(ES.ToUint16(0x80000000), 0, '2^31 returns +0');
		t.equal(ES.ToUint16(0x80000000 - 1), 0x10000 - 1, '2^31 - 1 returns 2^16 - 1');
		t.equal(ES.ToUint16(0x10000), 0, '2^16 returns +0');
		t.equal(ES.ToUint16(0x10000 - 1), 0x10000 - 1, '2^16 - 1 returns 2^16 - 1');
		t.end();
	});

	test('ToString', function (t) {
		forEach(v.objects.concat(v.nonSymbolPrimitives), function (item) {
			t.equal(ES.ToString(item), String(item), 'ES.ToString(' + debug(item) + ') ToStrings to String(' + debug(item) + ')');
		});

		t['throws'](function () { return ES.ToString(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws');

		t.end();
	});

	test('ToObject', function (t) {
		t['throws'](function () { return ES.ToObject(undefined); }, TypeError, 'undefined throws');
		t['throws'](function () { return ES.ToObject(null); }, TypeError, 'null throws');
		forEach(v.numbers, function (number) {
			var obj = ES.ToObject(number);
			t.equal(typeof obj, 'object', 'number ' + number + ' coerces to object');
			t.equal(true, obj instanceof Number, 'object of ' + number + ' is Number object');
			t.equal(obj.valueOf(), number, 'object of ' + number + ' coerces to ' + number);
		});
		t.end();
	});

	test('CheckObjectCoercible', function (t) {
		t['throws'](function () { return ES.CheckObjectCoercible(undefined); }, TypeError, 'undefined throws');
		t['throws'](function () { return ES.CheckObjectCoercible(null); }, TypeError, 'null throws');
		var checkCoercible = function (value) {
			t.doesNotThrow(function () { return ES.CheckObjectCoercible(value); }, debug(value) + ' does not throw');
		};
		forEach(v.objects.concat(v.nonNullPrimitives), checkCoercible);
		t.end();
	});

	test('IsCallable', function (t) {
		t.equal(true, ES.IsCallable(function () {}), 'function is callable');
		var nonCallables = [/a/g, {}, Object.prototype, NaN].concat(v.nonFunctions);
		forEach(nonCallables, function (nonCallable) {
			t.equal(false, ES.IsCallable(nonCallable), debug(nonCallable) + ' is not callable');
		});
		t.end();
	});

	test('SameValue', function (t) {
		t.equal(true, ES.SameValue(NaN, NaN), 'NaN is SameValue as NaN');
		t.equal(false, ES.SameValue(0, -0), '+0 is not SameValue as -0');
		forEach(v.objects.concat(v.primitives), function (val) {
			t.equal(val === val, ES.SameValue(val, val), debug(val) + ' is SameValue to itself');
		});
		t.end();
	});

	test('Type', function (t) {
		t.equal(ES.Type(), 'Undefined', 'Type() is Undefined');
		t.equal(ES.Type(undefined), 'Undefined', 'Type(undefined) is Undefined');
		t.equal(ES.Type(null), 'Null', 'Type(null) is Null');
		t.equal(ES.Type(true), 'Boolean', 'Type(true) is Boolean');
		t.equal(ES.Type(false), 'Boolean', 'Type(false) is Boolean');
		t.equal(ES.Type(0), 'Number', 'Type(0) is Number');
		t.equal(ES.Type(NaN), 'Number', 'Type(NaN) is Number');
		t.equal(ES.Type('abc'), 'String', 'Type("abc") is String');
		t.equal(ES.Type(function () {}), 'Object', 'Type(function () {}) is Object');
		t.equal(ES.Type({}), 'Object', 'Type({}) is Object');

		t.end();
	});

	assertRecordTests(ES, test);

	test('IsAccessorDescriptor', function (t) {
		forEach(v.nonUndefinedPrimitives, function (primitive) {
			t['throws'](
				function () { ES.IsAccessorDescriptor(primitive); },
				TypeError,
				debug(primitive) + ' is not a Property Descriptor'
			);
		});

		t.equal(ES.IsAccessorDescriptor(), false, 'no value is not an Accessor Descriptor');
		t.equal(ES.IsAccessorDescriptor(undefined), false, 'undefined value is not an Accessor Descriptor');

		t.equal(ES.IsAccessorDescriptor(v.accessorDescriptor()), true, 'accessor descriptor is an Accessor Descriptor');
		t.equal(ES.IsAccessorDescriptor(v.mutatorDescriptor()), true, 'mutator descriptor is an Accessor Descriptor');
		t.equal(ES.IsAccessorDescriptor(v.dataDescriptor()), false, 'data descriptor is not an Accessor Descriptor');
		t.equal(ES.IsAccessorDescriptor(v.genericDescriptor()), false, 'generic descriptor is not an Accessor Descriptor');

		t.end();
	});

	test('IsDataDescriptor', function (t) {
		forEach(v.nonUndefinedPrimitives, function (primitive) {
			t['throws'](
				function () { ES.IsDataDescriptor(primitive); },
				TypeError,
				debug(primitive) + ' is not a Property Descriptor'
			);
		});

		t.equal(ES.IsDataDescriptor(), false, 'no value is not a Data Descriptor');
		t.equal(ES.IsDataDescriptor(undefined), false, 'undefined value is not a Data Descriptor');

		t.equal(ES.IsDataDescriptor(v.accessorDescriptor()), false, 'accessor descriptor is not a Data Descriptor');
		t.equal(ES.IsDataDescriptor(v.mutatorDescriptor()), false, 'mutator descriptor is not a Data Descriptor');
		t.equal(ES.IsDataDescriptor(v.dataDescriptor()), true, 'data descriptor is a Data Descriptor');
		t.equal(ES.IsDataDescriptor(v.genericDescriptor()), false, 'generic descriptor is not a Data Descriptor');

		t.end();
	});

	test('IsGenericDescriptor', function (t) {
		forEach(v.nonUndefinedPrimitives, function (primitive) {
			t['throws'](
				function () { ES.IsGenericDescriptor(primitive); },
				TypeError,
				debug(primitive) + ' is not a Property Descriptor'
			);
		});

		t.equal(ES.IsGenericDescriptor(), false, 'no value is not a Data Descriptor');
		t.equal(ES.IsGenericDescriptor(undefined), false, 'undefined value is not a Data Descriptor');

		t.equal(ES.IsGenericDescriptor(v.accessorDescriptor()), false, 'accessor descriptor is not a generic Descriptor');
		t.equal(ES.IsGenericDescriptor(v.mutatorDescriptor()), false, 'mutator descriptor is not a generic Descriptor');
		t.equal(ES.IsGenericDescriptor(v.dataDescriptor()), false, 'data descriptor is not a generic Descriptor');

		t.equal(ES.IsGenericDescriptor(v.genericDescriptor()), true, 'generic descriptor is a generic Descriptor');

		t.end();
	});

	test('FromPropertyDescriptor', function (t) {
		t.equal(ES.FromPropertyDescriptor(), undefined, 'no value begets undefined');
		t.equal(ES.FromPropertyDescriptor(undefined), undefined, 'undefined value begets undefined');

		forEach(v.nonNullPrimitives.concat(null), function (primitive) {
			t['throws'](
				function () { ES.FromPropertyDescriptor(primitive); },
				TypeError,
				debug(primitive) + ' is not a Property Descriptor'
			);
		});

		var accessor = v.accessorDescriptor();
		t.deepEqual(ES.FromPropertyDescriptor(accessor), {
			get: accessor['[[Get]]'],
			set: accessor['[[Set]]'],
			enumerable: !!accessor['[[Enumerable]]'],
			configurable: !!accessor['[[Configurable]]']
		});

		var mutator = v.mutatorDescriptor();
		t.deepEqual(ES.FromPropertyDescriptor(mutator), {
			get: mutator['[[Get]]'],
			set: mutator['[[Set]]'],
			enumerable: !!mutator['[[Enumerable]]'],
			configurable: !!mutator['[[Configurable]]']
		});
		var data = v.dataDescriptor();
		t.deepEqual(ES.FromPropertyDescriptor(data), {
			value: data['[[Value]]'],
			writable: data['[[Writable]]'],
			enumerable: !!data['[[Enumerable]]'],
			configurable: !!data['[[Configurable]]']
		});

		t['throws'](
			function () { ES.FromPropertyDescriptor(v.genericDescriptor()); },
			TypeError,
			'a complete Property Descriptor is required'
		);

		t.end();
	});

	test('ToPropertyDescriptor', function (t) {
		forEach(v.nonUndefinedPrimitives, function (primitive) {
			t['throws'](
				function () { ES.ToPropertyDescriptor(primitive); },
				TypeError,
				debug(primitive) + ' is not an Object'
			);
		});

		var accessor = v.accessorDescriptor();
		t.deepEqual(ES.ToPropertyDescriptor({
			get: accessor['[[Get]]'],
			enumerable: !!accessor['[[Enumerable]]'],
			configurable: !!accessor['[[Configurable]]']
		}), accessor);

		var mutator = v.mutatorDescriptor();
		t.deepEqual(ES.ToPropertyDescriptor({
			set: mutator['[[Set]]'],
			enumerable: !!mutator['[[Enumerable]]'],
			configurable: !!mutator['[[Configurable]]']
		}), mutator);

		var data = v.descriptors.nonConfigurable(v.dataDescriptor());
		t.deepEqual(ES.ToPropertyDescriptor({
			value: data['[[Value]]'],
			writable: data['[[Writable]]'],
			configurable: !!data['[[Configurable]]']
		}), data);

		var both = v.bothDescriptor();
		t['throws'](
			function () {
				ES.ToPropertyDescriptor({ get: both['[[Get]]'], value: both['[[Value]]'] });
			},
			TypeError,
			'data and accessor descriptors are mutually exclusive'
		);

		t['throws'](
			function () { ES.ToPropertyDescriptor({ get: 'not callable' }); },
			TypeError,
			'"get" must be undefined or callable'
		);

		t['throws'](
			function () { ES.ToPropertyDescriptor({ set: 'not callable' }); },
			TypeError,
			'"set" must be undefined or callable'
		);

		forEach(v.nonFunctions, function (nonFunction) {
			if (typeof nonFunction !== 'undefined') {
				t['throws'](
					function () { ES.ToPropertyDescriptor({ get: nonFunction }); },
					TypeError,
					'`.get` has ' + debug(nonFunction) + ', which is not a Function'
				);
				t['throws'](
					function () { ES.ToPropertyDescriptor({ set: nonFunction }); },
					TypeError,
					'`.set` has ' + debug(nonFunction) + ', which is not a Function'
				);
			}
		});

		forEach(['get', 'set'], function (accessorName) {
			forEach(['value', 'writable'], function (dataName) {
				var o = {};
				o[accessorName] = undefined;
				o[dataName] = undefined;

				t['throws'](
					function () { ES.ToPropertyDescriptor(o); },
					TypeError,
					accessorName + ' + ' + dataName + ' is invalid'
				);
			});
		});

		t.end();
	});

	test('Abstract Equality Comparison', function (t) {
		t.test('same types use ===', function (st) {
			forEach(v.primitives.concat(v.objects), function (value) {
				st.equal(ES['Abstract Equality Comparison'](value, value), value === value, debug(value) + ' is abstractly equal to itself');
			});
			st.end();
		});

		t.test('different types coerce', function (st) {
			var pairs = [
				[null, undefined],
				[3, '3'],
				[true, '3'],
				[true, 3],
				[false, 0],
				[false, '0'],
				[3, [3]],
				['3', [3]],
				[true, [1]],
				[false, [0]],
				[String(v.coercibleObject), v.coercibleObject],
				[Number(String(v.coercibleObject)), v.coercibleObject],
				[Number(v.coercibleObject), v.coercibleObject],
				[String(Number(v.coercibleObject)), v.coercibleObject]
			];
			forEach(pairs, function (pair) {
				var a = pair[0];
				var b = pair[1];
				// eslint-disable-next-line eqeqeq
				st.equal(ES['Abstract Equality Comparison'](a, b), a == b, debug(a) + ' == ' + debug(b));
				// eslint-disable-next-line eqeqeq
				st.equal(ES['Abstract Equality Comparison'](b, a), b == a, debug(b) + ' == ' + debug(a));
			});
			st.end();
		});

		t.end();
	});

	test('Strict Equality Comparison', function (t) {
		t.test('same types use ===', function (st) {
			forEach(v.primitives.concat(v.objects), function (value) {
				st.equal(ES['Strict Equality Comparison'](value, value), value === value, debug(value) + ' is strictly equal to itself');
			});
			st.end();
		});

		t.test('different types are not ===', function (st) {
			var pairs = [
				[null, undefined],
				[3, '3'],
				[true, '3'],
				[true, 3],
				[false, 0],
				[false, '0'],
				[3, [3]],
				['3', [3]],
				[true, [1]],
				[false, [0]],
				[String(v.coercibleObject), v.coercibleObject],
				[Number(String(v.coercibleObject)), v.coercibleObject],
				[Number(v.coercibleObject), v.coercibleObject],
				[String(Number(v.coercibleObject)), v.coercibleObject]
			];
			forEach(pairs, function (pair) {
				var a = pair[0];
				var b = pair[1];
				st.equal(ES['Strict Equality Comparison'](a, b), a === b, debug(a) + ' === ' + debug(b));
				st.equal(ES['Strict Equality Comparison'](b, a), b === a, debug(b) + ' === ' + debug(a));
			});
			st.end();
		});

		t.end();
	});

	test('Abstract Relational Comparison', function (t) {
		t.test('at least one operand is NaN', function (st) {
			st.equal(ES['Abstract Relational Comparison'](NaN, {}, true), undefined, 'LeftFirst: first is NaN, returns undefined');
			st.equal(ES['Abstract Relational Comparison']({}, NaN, true), undefined, 'LeftFirst: second is NaN, returns undefined');
			st.equal(ES['Abstract Relational Comparison'](NaN, {}, false), undefined, '!LeftFirst: first is NaN, returns undefined');
			st.equal(ES['Abstract Relational Comparison']({}, NaN, false), undefined, '!LeftFirst: second is NaN, returns undefined');
			st.end();
		});

		forEach(v.nonBooleans, function (nonBoolean) {
			t['throws'](
				function () { ES['Abstract Relational Comparison'](3, 4, nonBoolean); },
				TypeError,
				debug(nonBoolean) + ' is not a Boolean'
			);
		});

		forEach(v.zeroes, function (zero) {
			t.equal(ES['Abstract Relational Comparison'](zero, 1, true), true, 'LeftFirst: ' + debug(zero) + ' is less than 1');
			t.equal(ES['Abstract Relational Comparison'](zero, 1, false), true, '!LeftFirst: ' + debug(zero) + ' is less than 1');
			t.equal(ES['Abstract Relational Comparison'](1, zero, true), false, 'LeftFirst: 1 is not less than ' + debug(zero));
			t.equal(ES['Abstract Relational Comparison'](1, zero, false), false, '!LeftFirst: 1 is not less than ' + debug(zero));

			t.equal(ES['Abstract Relational Comparison'](zero, zero, true), false, 'LeftFirst: ' + debug(zero) + ' is not less than ' + debug(zero));
			t.equal(ES['Abstract Relational Comparison'](zero, zero, false), false, '!LeftFirst: ' + debug(zero) + ' is not less than ' + debug(zero));
		});

		t.equal(ES['Abstract Relational Comparison'](Infinity, -Infinity, true), false, 'LeftFirst: ∞ is not less than -∞');
		t.equal(ES['Abstract Relational Comparison'](Infinity, -Infinity, false), false, '!LeftFirst: ∞ is not less than -∞');
		t.equal(ES['Abstract Relational Comparison'](-Infinity, Infinity, true), true, 'LeftFirst: -∞ is less than ∞');
		t.equal(ES['Abstract Relational Comparison'](-Infinity, Infinity, false), true, '!LeftFirst: -∞ is less than ∞');
		t.equal(ES['Abstract Relational Comparison'](-Infinity, 0, true), true, 'LeftFirst: -∞ is less than +0');
		t.equal(ES['Abstract Relational Comparison'](-Infinity, 0, false), true, '!LeftFirst: -∞ is less than +0');
		t.equal(ES['Abstract Relational Comparison'](0, -Infinity, true), false, 'LeftFirst: +0 is not less than -∞');
		t.equal(ES['Abstract Relational Comparison'](0, -Infinity, false), false, '!LeftFirst: +0 is not less than -∞');

		t.equal(ES['Abstract Relational Comparison'](3, 4, true), true, 'LeftFirst: 3 is less than 4');
		t.equal(ES['Abstract Relational Comparison'](4, 3, true), false, 'LeftFirst: 3 is not less than 4');
		t.equal(ES['Abstract Relational Comparison'](3, 4, false), true, '!LeftFirst: 3 is less than 4');
		t.equal(ES['Abstract Relational Comparison'](4, 3, false), false, '!LeftFirst: 3 is not less than 4');

		t.equal(ES['Abstract Relational Comparison']('3', '4', true), true, 'LeftFirst: "3" is less than "4"');
		t.equal(ES['Abstract Relational Comparison']('4', '3', true), false, 'LeftFirst: "3" is not less than "4"');
		t.equal(ES['Abstract Relational Comparison']('3', '4', false), true, '!LeftFirst: "3" is less than "4"');
		t.equal(ES['Abstract Relational Comparison']('4', '3', false), false, '!LeftFirst: "3" is not less than "4"');

		t.equal(ES['Abstract Relational Comparison']('a', 'abc', true), true, 'LeftFirst: "a" is less than "abc"');
		t.equal(ES['Abstract Relational Comparison']('abc', 'a', true), false, 'LeftFirst: "abc" is not less than "a"');
		t.equal(ES['Abstract Relational Comparison']('a', 'abc', false), true, '!LeftFirst: "a" is less than "abc"');
		t.equal(ES['Abstract Relational Comparison']('abc', 'a', false), false, '!LeftFirst: "abc" is not less than "a"');

		t.equal(ES['Abstract Relational Comparison'](v.coercibleObject, 42, true), true, 'LeftFirst: coercible object is less than 42');
		t.equal(ES['Abstract Relational Comparison'](42, v.coercibleObject, true), false, 'LeftFirst: 42 is not less than coercible object');
		t.equal(ES['Abstract Relational Comparison'](v.coercibleObject, 42, false), true, '!LeftFirst: coercible object is less than 42');
		t.equal(ES['Abstract Relational Comparison'](42, v.coercibleObject, false), false, '!LeftFirst: 42 is not less than coercible object');

		t.equal(ES['Abstract Relational Comparison'](v.coercibleObject, '3', true), false, 'LeftFirst: coercible object is not less than "3"');
		t.equal(ES['Abstract Relational Comparison']('3', v.coercibleObject, true), false, 'LeftFirst: "3" is not less than coercible object');
		t.equal(ES['Abstract Relational Comparison'](v.coercibleObject, '3', false), false, '!LeftFirst: coercible object is not less than "3"');
		t.equal(ES['Abstract Relational Comparison']('3', v.coercibleObject, false), false, '!LeftFirst: "3" is not less than coercible object');

		t.end();
	});

	test('SecFromTime', function (t) {
		var now = new Date();
		t.equal(ES.SecFromTime(now.getTime()), now.getUTCSeconds(), 'second from Date timestamp matches getUTCSeconds');
		t.end();
	});

	test('MinFromTime', function (t) {
		var now = new Date();
		t.equal(ES.MinFromTime(now.getTime()), now.getUTCMinutes(), 'minute from Date timestamp matches getUTCMinutes');
		t.end();
	});

	test('HourFromTime', function (t) {
		var now = new Date();
		t.equal(ES.HourFromTime(now.getTime()), now.getUTCHours(), 'hour from Date timestamp matches getUTCHours');
		t.end();
	});

	test('msFromTime', function (t) {
		var now = new Date();
		t.equal(ES.msFromTime(now.getTime()), now.getUTCMilliseconds(), 'ms from Date timestamp matches getUTCMilliseconds');
		t.end();
	});

	var msPerSecond = 1e3;
	var msPerMinute = 60 * msPerSecond;
	var msPerHour = 60 * msPerMinute;
	var msPerDay = 24 * msPerHour;

	test('Day', function (t) {
		var time = Date.UTC(2019, 8, 10, 2, 3, 4, 5);
		var add = 2.5;
		var later = new Date(time + (add * msPerDay));

		t.equal(ES.Day(later.getTime()), ES.Day(time) + Math.floor(add), 'adding 2.5 days worth of ms, gives a Day delta of 2');
		t.end();
	});

	test('DayFromYear', function (t) {
		t.equal(ES.DayFromYear(2021) - ES.DayFromYear(2020), 366, '2021 is a leap year, has 366 days');
		t.equal(ES.DayFromYear(2020) - ES.DayFromYear(2019), 365, '2020 is not a leap year, has 365 days');
		t.equal(ES.DayFromYear(2019) - ES.DayFromYear(2018), 365, '2019 is not a leap year, has 365 days');
		t.equal(ES.DayFromYear(2018) - ES.DayFromYear(2017), 365, '2018 is not a leap year, has 365 days');
		t.equal(ES.DayFromYear(2017) - ES.DayFromYear(2016), 366, '2017 is a leap year, has 366 days');

		t.end();
	});

	test('TimeWithinDay', function (t) {
		var time = Date.UTC(2019, 8, 10, 2, 3, 4, 5);
		var add = 2.5;
		var later = new Date(time + (add * msPerDay));

		t.equal(ES.TimeWithinDay(later.getTime()), ES.TimeWithinDay(time) + (0.5 * msPerDay), 'adding 2.5 days worth of ms, gives a TimeWithinDay delta of +0.5');
		t.end();
	});

	test('TimeFromYear', function (t) {
		for (var i = 1900; i < 2100; i += 1) {
			t.equal(ES.TimeFromYear(i), Date.UTC(i, 0, 1), 'TimeFromYear matches a Date object’s year: ' + i);
		}
		t.end();
	});

	test('YearFromTime', function (t) {
		for (var i = 1900; i < 2100; i += 1) {
			t.equal(ES.YearFromTime(Date.UTC(i, 0, 1)), i, 'YearFromTime matches a Date object’s year on 1/1: ' + i);
			t.equal(ES.YearFromTime(Date.UTC(i, 10, 1)), i, 'YearFromTime matches a Date object’s year on 10/1: ' + i);
		}
		t.end();
	});

	test('WeekDay', function (t) {
		var now = new Date();
		var today = now.getUTCDay();
		for (var i = 0; i < 7; i += 1) {
			var weekDay = ES.WeekDay(now.getTime() + (i * msPerDay));
			t.equal(weekDay, (today + i) % 7, i + ' days after today (' + today + '), WeekDay is ' + weekDay);
		}
		t.end();
	});

	test('DaysInYear', function (t) {
		t.equal(ES.DaysInYear(2021), 365, '2021 is not a leap year');
		t.equal(ES.DaysInYear(2020), 366, '2020 is a leap year');
		t.equal(ES.DaysInYear(2019), 365, '2019 is not a leap year');
		t.equal(ES.DaysInYear(2018), 365, '2018 is not a leap year');
		t.equal(ES.DaysInYear(2017), 365, '2017 is not a leap year');
		t.equal(ES.DaysInYear(2016), 366, '2016 is a leap year');
		t.equal(ES.DaysInYear(2000), 366, '2000 is a leap year');
		t.equal(ES.DaysInYear(1900), 365, '1900 is not a leap year');

		t.end();
	});

	test('InLeapYear', function (t) {
		t.equal(ES.InLeapYear(Date.UTC(2021, 0, 1)), 0, '2021 is not a leap year');
		t.equal(ES.InLeapYear(Date.UTC(2020, 0, 1)), 1, '2020 is a leap year');
		t.equal(ES.InLeapYear(Date.UTC(2019, 0, 1)), 0, '2019 is not a leap year');
		t.equal(ES.InLeapYear(Date.UTC(2018, 0, 1)), 0, '2018 is not a leap year');
		t.equal(ES.InLeapYear(Date.UTC(2017, 0, 1)), 0, '2017 is not a leap year');
		t.equal(ES.InLeapYear(Date.UTC(2016, 0, 1)), 1, '2016 is a leap year');

		t.end();
	});

	test('DayWithinYear', function (t) {
		t.equal(ES.DayWithinYear(Date.UTC(2019, 0, 1)), 0, '1/1 is the 1st day');
		t.equal(ES.DayWithinYear(Date.UTC(2019, 11, 31)), 364, '12/31 is the 365th day in a non leap year');
		t.equal(ES.DayWithinYear(Date.UTC(2016, 11, 31)), 365, '12/31 is the 366th day in a leap year');

		t.end();
	});

	test('MonthFromTime', function (t) {
		t.equal(ES.MonthFromTime(Date.UTC(2019, 0, 1)), 0, 'non-leap: 1/1 gives January');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 0, 31)), 0, 'non-leap: 1/31 gives January');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 1, 1)), 1, 'non-leap: 2/1 gives February');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 1, 28)), 1, 'non-leap: 2/28 gives February');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 1, 29)), 2, 'non-leap: 2/29 gives March');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 2, 1)), 2, 'non-leap: 3/1 gives March');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 2, 31)), 2, 'non-leap: 3/31 gives March');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 3, 1)), 3, 'non-leap: 4/1 gives April');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 3, 30)), 3, 'non-leap: 4/30 gives April');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 4, 1)), 4, 'non-leap: 5/1 gives May');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 4, 31)), 4, 'non-leap: 5/31 gives May');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 5, 1)), 5, 'non-leap: 6/1 gives June');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 5, 30)), 5, 'non-leap: 6/30 gives June');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 6, 1)), 6, 'non-leap: 7/1 gives July');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 6, 31)), 6, 'non-leap: 7/31 gives July');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 7, 1)), 7, 'non-leap: 8/1 gives August');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 7, 30)), 7, 'non-leap: 8/30 gives August');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 8, 1)), 8, 'non-leap: 9/1 gives September');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 8, 30)), 8, 'non-leap: 9/30 gives September');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 9, 1)), 9, 'non-leap: 10/1 gives October');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 9, 31)), 9, 'non-leap: 10/31 gives October');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 10, 1)), 10, 'non-leap: 11/1 gives November');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 10, 30)), 10, 'non-leap: 11/30 gives November');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 11, 1)), 11, 'non-leap: 12/1 gives December');
		t.equal(ES.MonthFromTime(Date.UTC(2019, 11, 31)), 11, 'non-leap: 12/31 gives December');

		t.equal(ES.MonthFromTime(Date.UTC(2016, 0, 1)), 0, 'leap: 1/1 gives January');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 0, 31)), 0, 'leap: 1/31 gives January');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 1, 1)), 1, 'leap: 2/1 gives February');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 1, 28)), 1, 'leap: 2/28 gives February');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 1, 29)), 1, 'leap: 2/29 gives February');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 2, 1)), 2, 'leap: 3/1 gives March');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 2, 31)), 2, 'leap: 3/31 gives March');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 3, 1)), 3, 'leap: 4/1 gives April');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 3, 30)), 3, 'leap: 4/30 gives April');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 4, 1)), 4, 'leap: 5/1 gives May');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 4, 31)), 4, 'leap: 5/31 gives May');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 5, 1)), 5, 'leap: 6/1 gives June');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 5, 30)), 5, 'leap: 6/30 gives June');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 6, 1)), 6, 'leap: 7/1 gives July');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 6, 31)), 6, 'leap: 7/31 gives July');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 7, 1)), 7, 'leap: 8/1 gives August');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 7, 30)), 7, 'leap: 8/30 gives August');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 8, 1)), 8, 'leap: 9/1 gives September');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 8, 30)), 8, 'leap: 9/30 gives September');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 9, 1)), 9, 'leap: 10/1 gives October');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 9, 31)), 9, 'leap: 10/31 gives October');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 10, 1)), 10, 'leap: 11/1 gives November');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 10, 30)), 10, 'leap: 11/30 gives November');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 11, 1)), 11, 'leap: 12/1 gives December');
		t.equal(ES.MonthFromTime(Date.UTC(2016, 11, 31)), 11, 'leap: 12/31 gives December');
		t.end();
	});

	test('DateFromTime', function (t) {
		var i;
		for (i = 1; i <= 28; i += 1) {
			t.equal(ES.DateFromTime(Date.UTC(2019, 1, i)), i, '2019.02.' + i + ' is date ' + i);
		}
		for (i = 1; i <= 29; i += 1) {
			t.equal(ES.DateFromTime(Date.UTC(2016, 1, i)), i, '2016.02.' + i + ' is date ' + i);
		}
		for (i = 1; i <= 30; i += 1) {
			t.equal(ES.DateFromTime(Date.UTC(2019, 2, i)), i, '2019.03.' + i + ' is date ' + i);
			t.equal(ES.DateFromTime(Date.UTC(2019, 3, i)), i, '2019.04.' + i + ' is date ' + i);
			t.equal(ES.DateFromTime(Date.UTC(2019, 5, i)), i, '2019.06.' + i + ' is date ' + i);
			t.equal(ES.DateFromTime(Date.UTC(2019, 7, i)), i, '2019.08.' + i + ' is date ' + i);
			t.equal(ES.DateFromTime(Date.UTC(2019, 8, i)), i, '2019.09.' + i + ' is date ' + i);
			t.equal(ES.DateFromTime(Date.UTC(2019, 10, i)), i, '2019.11.' + i + ' is date ' + i);
		}
		for (i = 1; i <= 31; i += 1) {
			t.equal(ES.DateFromTime(Date.UTC(2019, 0, i)), i, '2019.01.' + i + ' is date ' + i);
			t.equal(ES.DateFromTime(Date.UTC(2019, 4, i)), i, '2019.05.' + i + ' is date ' + i);
			t.equal(ES.DateFromTime(Date.UTC(2019, 6, i)), i, '2019.07.' + i + ' is date ' + i);
			t.equal(ES.DateFromTime(Date.UTC(2019, 9, i)), i, '2019.10.' + i + ' is date ' + i);
			t.equal(ES.DateFromTime(Date.UTC(2019, 11, i)), i, '2019.12.' + i + ' is date ' + i);
		}
		t.end();
	});

	test('MakeDay', function (t) {
		forEach([NaN, Infinity, -Infinity], function (nonFiniteNumber) {
			t.equal(ES.MakeDay(nonFiniteNumber, 0, 0), NaN, 'year: ' + debug(nonFiniteNumber) + ' is not finite');
			t.equal(ES.MakeDay(0, nonFiniteNumber, 0), NaN, 'month: ' + debug(nonFiniteNumber) + ' is not finite');
			t.equal(ES.MakeDay(0, 0, nonFiniteNumber), NaN, 'date: ' + debug(nonFiniteNumber) + ' is not finite');
		});

		var day2015 = 16687;
		t.equal(ES.MakeDay(2015, 8, 9), day2015, '2015.09.09 is day 16687');
		var day2016 = day2015 + 366; // 2016 is a leap year
		t.equal(ES.MakeDay(2016, 8, 9), day2016, '2015.09.09 is day 17053');
		var day2017 = day2016 + 365;
		t.equal(ES.MakeDay(2017, 8, 9), day2017, '2017.09.09 is day 17418');
		var day2018 = day2017 + 365;
		t.equal(ES.MakeDay(2018, 8, 9), day2018, '2018.09.09 is day 17783');
		var day2019 = day2018 + 365;
		t.equal(ES.MakeDay(2019, 8, 9), day2019, '2019.09.09 is day 18148');

		t.end();
	});

	test('MakeDate', function (t) {
		forEach(v.infinities.concat(NaN), function (nonFiniteNumber) {
			t.equal(ES.MakeDate(nonFiniteNumber, 0), NaN, debug(nonFiniteNumber) + ' is not a finite `day`');
			t.equal(ES.MakeDate(0, nonFiniteNumber), NaN, debug(nonFiniteNumber) + ' is not a finite `time`');
		});
		t.equal(ES.MakeDate(0, 0), 0, 'zero day and zero time is zero date');
		t.equal(ES.MakeDate(0, 123), 123, 'zero day and nonzero time is a date of the "time"');
		t.equal(ES.MakeDate(1, 0), msPerDay, 'day of 1 and zero time is a date of "ms per day"');
		t.equal(ES.MakeDate(3, 0), 3 * msPerDay, 'day of 3 and zero time is a date of thrice "ms per day"');
		t.equal(ES.MakeDate(1, 123), msPerDay + 123, 'day of 1 and nonzero time is a date of "ms per day" plus the "time"');
		t.equal(ES.MakeDate(3, 123), (3 * msPerDay) + 123, 'day of 3 and nonzero time is a date of thrice "ms per day" plus the "time"');

		t.end();
	});

	test('MakeTime', function (t) {
		forEach(v.infinities.concat(NaN), function (nonFiniteNumber) {
			t.equal(ES.MakeTime(nonFiniteNumber, 0, 0, 0), NaN, debug(nonFiniteNumber) + ' is not a finite `hour`');
			t.equal(ES.MakeTime(0, nonFiniteNumber, 0, 0), NaN, debug(nonFiniteNumber) + ' is not a finite `min`');
			t.equal(ES.MakeTime(0, 0, nonFiniteNumber, 0), NaN, debug(nonFiniteNumber) + ' is not a finite `sec`');
			t.equal(ES.MakeTime(0, 0, 0, nonFiniteNumber), NaN, debug(nonFiniteNumber) + ' is not a finite `ms`');
		});

		t.equal(
			ES.MakeTime(1.2, 2.3, 3.4, 4.5),
			(1 * msPerHour) + (2 * msPerMinute) + (3 * msPerSecond) + 4,
			'all numbers are converted to integer, multiplied by the right number of ms, and summed'
		);

		t.end();
	});

	test('TimeClip', function (t) {
		forEach(v.infinities.concat(NaN), function (nonFiniteNumber) {
			t.equal(ES.TimeClip(nonFiniteNumber), NaN, debug(nonFiniteNumber) + ' is not a finite `time`');
		});
		t.equal(ES.TimeClip(8.64e15 + 1), NaN, '8.64e15 is the largest magnitude considered "finite"');
		t.equal(ES.TimeClip(-8.64e15 - 1), NaN, '-8.64e15 is the largest magnitude considered "finite"');

		forEach(v.zeroes.concat([-10, 10, +new Date()]), function (time) {
			t.looseEqual(ES.TimeClip(time), time, debug(time) + ' is a time of ' + debug(time));
		});

		t.end();
	});

	test('modulo', function (t) {
		t.equal(3 % 2, 1, '+3 % 2 is +1');
		t.equal(ES.modulo(3, 2), 1, '+3 mod 2 is +1');

		t.equal(-3 % 2, -1, '-3 % 2 is -1');
		t.equal(ES.modulo(-3, 2), 1, '-3 mod 2 is +1');
		t.end();
	});
};

var es2015 = function ES2015(ES, ops, expectedMissing, skips) {
	es5(ES, ops, expectedMissing, assign(assign({}, skips), {
		CheckObjectCoercible: true,
		FromPropertyDescriptor: true,
		ToNumber: true,
		ToString: true,
		Type: true
	}));
	var test = makeTest(skips);

	var getNamelessFunction = function () {
		var f = Object(function () {});
		try {
			delete f.name;
		} catch (e) { /**/ }
		return f;
	};

	test('AdvanceStringIndex', function (t) {
		forEach(v.nonStrings, function (nonString) {
			t['throws'](
				function () { ES.AdvanceStringIndex(nonString); },
				TypeError,
				'"S" argument must be a String; ' + debug(nonString) + ' is not'
			);
		});

		var notInts = v.nonNumbers.concat(
			v.nonIntegerNumbers,
			v.infinities,
			[NaN, [], new Date(), Math.pow(2, 53), -1]
		);
		forEach(notInts, function (nonInt) {
			t['throws'](
				function () { ES.AdvanceStringIndex('abc', nonInt); },
				TypeError,
				'"index" argument must be an integer, ' + debug(nonInt) + ' is not.'
			);
		});

		forEach(v.nonBooleans, function (nonBoolean) {
			t['throws'](
				function () { ES.AdvanceStringIndex('abc', 0, nonBoolean); },
				TypeError,
				debug(nonBoolean) + ' is not a Boolean'
			);
		});

		var str = 'a' + wholePoo + 'c';

		t.test('non-unicode mode', function (st) {
			for (var i = 0; i < str.length + 2; i += 1) {
				st.equal(ES.AdvanceStringIndex(str, i, false), i + 1, i + ' advances to ' + (i + 1));
			}

			st.end();
		});

		t.test('unicode mode', function (st) {
			st.equal(ES.AdvanceStringIndex(str, 0, true), 1, '0 advances to 1');
			st.equal(ES.AdvanceStringIndex(str, 1, true), 3, '1 advances to 3');
			st.equal(ES.AdvanceStringIndex(str, 2, true), 3, '2 advances to 3');
			st.equal(ES.AdvanceStringIndex(str, 3, true), 4, '3 advances to 4');
			st.equal(ES.AdvanceStringIndex(str, 4, true), 5, '4 advances to 5');

			st.end();
		});

		t.test('lone surrogates', function (st) {
			var halfPoo = 'a' + leadingPoo + 'c';

			st.equal(ES.AdvanceStringIndex(halfPoo, 0, true), 1, '0 advances to 1');
			st.equal(ES.AdvanceStringIndex(halfPoo, 1, true), 2, '1 advances to 2');
			st.equal(ES.AdvanceStringIndex(halfPoo, 2, true), 3, '2 advances to 3');
			st.equal(ES.AdvanceStringIndex(halfPoo, 3, true), 4, '3 advances to 4');

			st.end();
		});

		t.test('surrogate pairs', function (st) {
			var lowestPair = String.fromCharCode('0xD800') + String.fromCharCode('0xDC00');
			var highestPair = String.fromCharCode('0xDBFF') + String.fromCharCode('0xDFFF');

			st.equal(ES.AdvanceStringIndex(lowestPair, 0, true), 2, 'lowest surrogate pair, 0 -> 2');
			st.equal(ES.AdvanceStringIndex(highestPair, 0, true), 2, 'highest surrogate pair, 0 -> 2');
			st.equal(ES.AdvanceStringIndex(wholePoo, 0, true), 2, 'poop, 0 -> 2');

			st.end();
		});

		t.end();
	});

	test('ArrayCreate', function (t) {
		forEach(v.nonIntegerNumbers.concat([-1]), function (nonIntegerNumber) {
			t['throws'](
				function () { ES.ArrayCreate(nonIntegerNumber); },
				TypeError,
				'length must be an integer number >= 0'
			);
		});

		t['throws'](
			function () { ES.ArrayCreate(Math.pow(2, 32)); },
			RangeError,
			'length must be < 2**32'
		);

		t.deepEqual(ES.ArrayCreate(-0), [], 'length of -0 creates an empty array');
		t.deepEqual(ES.ArrayCreate(0), [], 'length of +0 creates an empty array');
		// eslint-disable-next-line no-sparse-arrays, comma-spacing
		t.deepEqual(ES.ArrayCreate(1), [,], 'length of 1 creates a sparse array of length 1');
		// eslint-disable-next-line no-sparse-arrays, comma-spacing
		t.deepEqual(ES.ArrayCreate(2), [,,], 'length of 2 creates a sparse array of length 2');

		t.test('proto argument', { skip: !$setProto }, function (st) {
			var fakeProto = {
				push: { toString: function () { return 'not array push'; } }
			};
			st.equal(ES.ArrayCreate(0, fakeProto).push, fakeProto.push, 'passing the proto argument works');
			st.end();
		});

		t.end();
	});

	test('ArraySetLength', function (t) {
		forEach(v.primitives.concat(v.objects), function (nonArray) {
			t['throws'](
				function () { ES.ArraySetLength(nonArray, { '[[Value]]': 0 }); },
				TypeError,
				'A: ' + debug(nonArray) + ' is not an Array'
			);
		});

		forEach(v.nonUndefinedPrimitives, function (primitive) {
			t['throws'](
				function () { ES.ArraySetLength([], primitive); },
				TypeError,
				'Desc: ' + debug(primitive) + ' is not a Property Descriptor'
			);
		});

		t.test('making length nonwritable', { skip: !getOwnPropertyDescriptor }, function (st) {
			var a = [];
			ES.ArraySetLength(a, { '[[Writable]]': false });
			st.deepEqual(
				getOwnPropertyDescriptor(a, 'length'),
				{
					configurable: false,
					enumerable: false,
					value: 0,
					writable: false
				},
				'without a value, length becomes nonwritable'
			);
			st.end();
		});

		forEach([-1, Math.pow(2, 32)].concat(v.nonIntegerNumbers), function (nonLength) {
			t['throws'](
				function () { ES.ArraySetLength([], { '[[Value]]': nonLength }); },
				RangeError,
				'a non-integer, negative, or > (2**31 - 1) is not a valid length: ' + debug(nonLength)
			);
		});

		var arr = [];
		ES.ArraySetLength(arr, { '[[Value]]': 7 });
		t.equal(arr.length, 7, 'array now has a length of 7');

		t.end();
	});

	test('ArraySpeciesCreate', function (t) {
		t.test('errors', function (st) {
			var testNonNumber = function (nonNumber) {
				st['throws'](
					function () { ES.ArraySpeciesCreate([], nonNumber); },
					TypeError,
					debug(nonNumber) + ' is not a number'
				);
			};
			forEach(v.nonNumbers, testNonNumber);

			st['throws'](
				function () { ES.ArraySpeciesCreate([], -1); },
				TypeError,
				'-1 is not >= 0'
			);
			st['throws'](
				function () { ES.ArraySpeciesCreate([], -Infinity); },
				TypeError,
				'-Infinity is not >= 0'
			);

			var testNonIntegers = function (nonInteger) {
				st['throws'](
					function () { ES.ArraySpeciesCreate([], nonInteger); },
					TypeError,
					debug(nonInteger) + ' is not an integer'
				);
			};
			forEach(v.nonIntegerNumbers, testNonIntegers);

			st.end();
		});

		t.test('works with a non-array', function (st) {
			forEach(v.objects.concat(v.primitives), function (nonArray) {
				var arr = ES.ArraySpeciesCreate(nonArray, 0);
				st.ok(ES.IsArray(arr), 'is an array');
				st.equal(arr.length, 0, 'length is correct');
				st.equal(arr.constructor, Array, 'constructor is correct');
			});

			st.end();
		});

		t.test('works with a normal array', function (st) {
			var len = 2;
			var orig = [1, 2, 3];
			var arr = ES.ArraySpeciesCreate(orig, len);

			st.ok(ES.IsArray(arr), 'is an array');
			st.equal(arr.length, len, 'length is correct');
			st.equal(arr.constructor, orig.constructor, 'constructor is correct');

			st.end();
		});

		t.test('-0 length produces +0 length', function (st) {
			var len = -0;
			st.equal(len, -0, '-0 is negative zero');
			st.notEqual(len, 0, '-0 is not positive zero');

			var orig = [1, 2, 3];
			var arr = ES.ArraySpeciesCreate(orig, len);

			st.equal(ES.IsArray(arr), true);
			st.equal(arr.length, 0);
			st.equal(arr.constructor, orig.constructor);

			st.end();
		});

		t.test('works with species construtor', { skip: !hasSpecies }, function (st) {
			var sentinel = {};
			var Foo = function Foo(len) {
				this.length = len;
				this.sentinel = sentinel;
			};
			var Bar = getArraySubclassWithSpeciesConstructor(Foo);
			var bar = new Bar();

			st.equal(ES.IsArray(bar), true, 'Bar instance is an array');

			var arr = ES.ArraySpeciesCreate(bar, 3);
			st.equal(arr.constructor, Foo, 'result used species constructor');
			st.equal(arr.length, 3, 'length property is correct');
			st.equal(arr.sentinel, sentinel, 'Foo constructor was exercised');

			st.end();
		});

		t.test('works with null species constructor', { skip: !hasSpecies }, function (st) {
			var Bar = getArraySubclassWithSpeciesConstructor(null);
			var bar = new Bar();

			st.equal(ES.IsArray(bar), true, 'Bar instance is an array');

			var arr = ES.ArraySpeciesCreate(bar, 3);
			st.equal(arr.constructor, Array, 'result used default constructor');
			st.equal(arr.length, 3, 'length property is correct');

			st.end();
		});

		t.test('works with undefined species constructor', { skip: !hasSpecies }, function (st) {
			var Bar = getArraySubclassWithSpeciesConstructor();
			var bar = new Bar();

			st.equal(ES.IsArray(bar), true, 'Bar instance is an array');

			var arr = ES.ArraySpeciesCreate(bar, 3);
			st.equal(arr.constructor, Array, 'result used default constructor');
			st.equal(arr.length, 3, 'length property is correct');

			st.end();
		});

		t.test('throws with object non-construtor species constructor', { skip: !hasSpecies }, function (st) {
			forEach(v.objects, function (obj) {
				var Bar = getArraySubclassWithSpeciesConstructor(obj);
				var bar = new Bar();

				st.equal(ES.IsArray(bar), true, 'Bar instance is an array');

				st['throws'](
					function () { ES.ArraySpeciesCreate(bar, 3); },
					TypeError,
					debug(obj) + ' is not a constructor'
				);
			});

			st.end();
		});

		t.end();
	});

	test('Call', function (t) {
		var receiver = {};
		var notFuncs = v.nonFunctions.concat([/a/g, new RegExp('a', 'g')]);
		t.plan(notFuncs.length + v.nonArrays.length + 5);

		forEach(notFuncs, function (notFunc) {
			t['throws'](
				function () { return ES.Call(notFunc, receiver); },
				TypeError,
				debug(notFunc) + ' (' + typeof notFunc + ') is not callable'
			);
		});

		forEach(v.nonArrays, function (nonArray) {
			t['throws'](
				function () { ES.Call(Function.prototype, null, nonArray); },
				TypeError,
				debug(nonArray) + ' is not an array'
			);
		});

		ES.Call(
			function (a, b) {
				t.equal(this, receiver, 'context matches expected');
				t.deepEqual([a, b], [1, 2], 'named args are correct');
				t.equal(arguments.length, 3, 'extra argument was passed');
				t.equal(arguments[2], 3, 'extra argument was correct');
			},
			receiver,
			[1, 2, 3]
		);

		t.test('Call doesn’t use func.apply', function (st) {
			st.plan(4);

			var bad = function (a, b) {
				st.equal(this, receiver, 'context matches expected');
				st.deepEqual([a, b], [1, 2], 'named args are correct');
				st.equal(arguments.length, 3, 'extra argument was passed');
				st.equal(arguments[2], 3, 'extra argument was correct');
			};

			defineProperty(bad, 'apply', {
				value: function () {
					st.fail('bad.apply shouldn’t get called');
				}
			});

			ES.Call(bad, receiver, [1, 2, 3]);
			st.end();
		});

		t.end();
	});

	test('CanonicalNumericIndexString', function (t) {
		var throwsOnNonString = function (notString) {
			t['throws'](
				function () { return ES.CanonicalNumericIndexString(notString); },
				TypeError,
				debug(notString) + ' is not a string'
			);
		};
		forEach(v.objects.concat(v.numbers), throwsOnNonString);
		t.equal(ES.CanonicalNumericIndexString('-0'), -0, '"-0" returns -0');
		for (var i = -50; i < 50; i += 10) {
			t.equal(i, ES.CanonicalNumericIndexString(String(i)), '"' + i + '" returns ' + i);
			t.equal(undefined, ES.CanonicalNumericIndexString(String(i) + 'a'), '"' + i + 'a" returns undefined');
		}
		t.end();
	});

	test('CompletePropertyDescriptor', function (t) {
		forEach(v.nonUndefinedPrimitives, function (primitive) {
			t['throws'](
				function () { ES.CompletePropertyDescriptor(primitive); },
				TypeError,
				debug(primitive) + ' is not a Property Descriptor'
			);
		});

		var generic = v.genericDescriptor();
		t.deepEqual(
			ES.CompletePropertyDescriptor(generic),
			{
				'[[Configurable]]': !!generic['[[Configurable]]'],
				'[[Enumerable]]': !!generic['[[Enumerable]]'],
				'[[Value]]': undefined,
				'[[Writable]]': false
			},
			'completes a Generic Descriptor'
		);

		var data = v.dataDescriptor();
		t.deepEqual(
			ES.CompletePropertyDescriptor(data),
			{
				'[[Configurable]]': !!data['[[Configurable]]'],
				'[[Enumerable]]': false,
				'[[Value]]': data['[[Value]]'],
				'[[Writable]]': !!data['[[Writable]]']
			},
			'completes a Data Descriptor'
		);

		var accessor = v.accessorDescriptor();
		t.deepEqual(
			ES.CompletePropertyDescriptor(accessor),
			{
				'[[Get]]': accessor['[[Get]]'],
				'[[Enumerable]]': !!accessor['[[Enumerable]]'],
				'[[Configurable]]': !!accessor['[[Configurable]]'],
				'[[Set]]': undefined
			},
			'completes an Accessor Descriptor'
		);

		var mutator = v.mutatorDescriptor();
		t.deepEqual(
			ES.CompletePropertyDescriptor(mutator),
			{
				'[[Set]]': mutator['[[Set]]'],
				'[[Enumerable]]': !!mutator['[[Enumerable]]'],
				'[[Configurable]]': !!mutator['[[Configurable]]'],
				'[[Get]]': undefined
			},
			'completes a mutator Descriptor'
		);

		t['throws'](
			function () { ES.CompletePropertyDescriptor(v.bothDescriptor()); },
			TypeError,
			'data and accessor descriptors are mutually exclusive'
		);

		t.end();
	});

	test('CreateDataProperty', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.CreateDataProperty(primitive); },
				TypeError,
				debug(primitive) + ' is not an object'
			);
		});

		forEach(v.nonPropertyKeys, function (nonPropertyKey) {
			t['throws'](
				function () { ES.CreateDataProperty({}, nonPropertyKey); },
				TypeError,
				debug(nonPropertyKey) + ' is not a property key'
			);
		});

		var sentinel = { id: 'sentinel' };
		var secondSentinel = { id: 'second sentinel' };
		forEach(v.propertyKeys, function (propertyKey) {
			var obj = {};
			var status = ES.CreateDataProperty(obj, propertyKey, sentinel);
			t.equal(status, true, 'status is true');
			t.equal(
				obj[propertyKey],
				sentinel,
				debug(sentinel) + ' is installed on "' + debug(propertyKey) + '" on the object'
			);
			var secondStatus = ES.CreateDataProperty(obj, propertyKey, secondSentinel);
			t.equal(secondStatus, true, 'second status is true');
			t.equal(
				obj[propertyKey],
				secondSentinel,
				debug(secondSentinel) + ' is installed on "' + debug(propertyKey) + '" on the object'
			);

			t.test('with defineProperty', { skip: !defineProperty.oDP }, function (st) {
				var nonWritable = defineProperty({}, propertyKey, { configurable: true, writable: false });

				var nonWritableStatus = ES.CreateDataProperty(nonWritable, propertyKey, sentinel);
				st.equal(nonWritableStatus, false, 'create data property failed');
				st.notEqual(
					nonWritable[propertyKey],
					sentinel,
					debug(sentinel) + ' is not installed on "' + debug(propertyKey) + '" on the object when key is nonwritable'
				);

				var nonConfigurable = defineProperty({}, propertyKey, { configurable: false, writable: true });

				var nonConfigurableStatus = ES.CreateDataProperty(nonConfigurable, propertyKey, sentinel);
				st.equal(nonConfigurableStatus, false, 'create data property failed');
				st.notEqual(
					nonConfigurable[propertyKey],
					sentinel,
					debug(sentinel) + ' is not installed on "' + debug(propertyKey) + '" on the object when key is nonconfigurable'
				);
				st.end();
			});
		});

		t.end();
	});

	test('CreateDataPropertyOrThrow', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.CreateDataPropertyOrThrow(primitive); },
				TypeError,
				debug(primitive) + ' is not an object'
			);
		});

		forEach(v.nonPropertyKeys, function (nonPropertyKey) {
			t['throws'](
				function () { ES.CreateDataPropertyOrThrow({}, nonPropertyKey); },
				TypeError,
				debug(nonPropertyKey) + ' is not a property key'
			);
		});

		var sentinel = {};
		forEach(v.propertyKeys, function (propertyKey) {
			var obj = {};
			var status = ES.CreateDataPropertyOrThrow(obj, propertyKey, sentinel);
			t.equal(status, true, 'status is true');
			t.equal(
				obj[propertyKey],
				sentinel,
				debug(sentinel) + ' is installed on "' + debug(propertyKey) + '" on the object'
			);

			if (typeof Object.preventExtensions === 'function') {
				var notExtensible = {};
				Object.preventExtensions(notExtensible);

				t['throws'](
					function () { ES.CreateDataPropertyOrThrow(notExtensible, propertyKey, sentinel); },
					TypeError,
					'can not install ' + debug(propertyKey) + ' on non-extensible object'
				);
				t.notEqual(
					notExtensible[propertyKey],
					sentinel,
					debug(sentinel) + ' is not installed on "' + debug(propertyKey) + '" on the object'
				);
			}
		});

		t.end();
	});

	test('CreateListFromArrayLike', function (t) {
		forEach(v.primitives, function (nonObject) {
			t['throws'](
				function () { ES.CreateListFromArrayLike(nonObject); },
				TypeError,
				debug(nonObject) + ' is not an Object'
			);
		});
		forEach(v.nonArrays, function (nonArray) {
			t['throws'](
				function () { ES.CreateListFromArrayLike({}, nonArray); },
				TypeError,
				debug(nonArray) + ' is not an Array'
			);
		});

		t.deepEqual(
			ES.CreateListFromArrayLike({ length: 2, 0: 'a', 1: 'b', 2: 'c' }),
			['a', 'b'],
			'arraylike stops at the length'
		);

		t.end();
	});

	test('CreateHTML', function (t) {
		forEach(v.nonStrings, function (nonString) {
			t['throws'](
				function () { ES.CreateHTML('', nonString, '', ''); },
				TypeError,
				'tag: ' + debug(nonString) + ' is not a String'
			);
			t['throws'](
				function () { ES.CreateHTML('', '', nonString, ''); },
				TypeError,
				'attribute: ' + debug(nonString) + ' is not a String'
			);
		});

		t.equal(
			ES.CreateHTML(
				{ toString: function () { return 'the string'; } },
				'some HTML tag!',
				''
			),
			'<some HTML tag!>the string</some HTML tag!>',
			'works with an empty string attribute value'
		);

		t.equal(
			ES.CreateHTML(
				{ toString: function () { return 'the string'; } },
				'some HTML tag!',
				'attr',
				'value "with quotes"'
			),
			'<some HTML tag! attr="value &quot;with quotes&quot;">the string</some HTML tag!>',
			'works with an attribute, and a value with quotes'
		);

		t.end();
	});

	test('CreateMethodProperty', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.CreateMethodProperty(primitive, 'key'); },
				TypeError,
				'O must be an Object'
			);
		});

		forEach(v.nonPropertyKeys, function (nonPropertyKey) {
			t['throws'](
				function () { ES.CreateMethodProperty({}, nonPropertyKey); },
				TypeError,
				debug(nonPropertyKey) + ' is not a Property Key'
			);
		});

		t.test('defines correctly', function (st) {
			var obj = {};
			var key = 'the key';
			var value = { foo: 'bar' };

			st.equal(ES.CreateMethodProperty(obj, key, value), true, 'defines property successfully');
			st.test('property descriptor', { skip: !getOwnPropertyDescriptor }, function (s2t) {
				s2t.deepEqual(
					getOwnPropertyDescriptor(obj, key),
					{
						configurable: true,
						enumerable: false,
						value: value,
						writable: true
					},
					'sets the correct property descriptor'
				);

				s2t.end();
			});
			st.equal(obj[key], value, 'sets the correct value');

			st.end();
		});

		t.test('fails as expected on a frozen object', { skip: !Object.freeze }, function (st) {
			var obj = Object.freeze({ foo: 'bar' });
			st['throws'](
				function () { ES.CreateMethodProperty(obj, 'foo', { value: 'baz' }); },
				TypeError,
				'nonconfigurable key can not be defined'
			);

			st.end();
		});

		t.test('fails as expected on a function with a nonconfigurable name', { skip: !functionsHaveNames || functionsHaveConfigurableNames }, function (st) {
			st['throws'](
				function () { ES.CreateMethodProperty(function () {}, 'name', { value: 'baz' }); },
				TypeError,
				'nonconfigurable function name can not be defined'
			);
			st.end();
		});

		t.end();
	});

	test('CreateIterResultObject', function (t) {
		forEach(v.nonBooleans, function (nonBoolean) {
			t['throws'](
				function () { ES.CreateIterResultObject({}, nonBoolean); },
				TypeError,
				'"done" argument must be a boolean; ' + debug(nonBoolean) + ' is not'
			);
		});

		var value = {};
		t.deepEqual(
			ES.CreateIterResultObject(value, true),
			{ value: value, done: true },
			'creates a "done" iteration result'
		);
		t.deepEqual(
			ES.CreateIterResultObject(value, false),
			{ value: value, done: false },
			'creates a "not done" iteration result'
		);

		t.end();
	});

	test('DefinePropertyOrThrow', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.DefinePropertyOrThrow(primitive, 'key', {}); },
				TypeError,
				'O must be an Object'
			);
		});

		forEach(v.nonPropertyKeys, function (nonPropertyKey) {
			t['throws'](
				function () { ES.DefinePropertyOrThrow({}, nonPropertyKey, {}); },
				TypeError,
				debug(nonPropertyKey) + ' is not a Property Key'
			);
		});

		t.test('defines correctly', function (st) {
			var obj = {};
			var key = 'the key';
			var descriptor = {
				configurable: true,
				enumerable: false,
				value: { foo: 'bar' },
				writable: true
			};

			st.equal(ES.DefinePropertyOrThrow(obj, key, descriptor), true, 'defines property successfully');
			st.test('property descriptor', { skip: !getOwnPropertyDescriptor }, function (s2t) {
				s2t.deepEqual(
					getOwnPropertyDescriptor(obj, key),
					descriptor,
					'sets the correct property descriptor'
				);

				s2t.end();
			});
			st.deepEqual(obj[key], descriptor.value, 'sets the correct value');

			st.end();
		});

		t.test('fails as expected on a frozen object', { skip: !Object.freeze }, function (st) {
			var obj = Object.freeze({ foo: 'bar' });
			st['throws'](
				function () {
					ES.DefinePropertyOrThrow(obj, 'foo', { configurable: true, value: 'baz' });
				},
				TypeError,
				'nonconfigurable key can not be defined'
			);

			st.end();
		});

		t.test('fails as expected on a function with a nonconfigurable name', { skip: !functionsHaveNames || functionsHaveConfigurableNames }, function (st) {
			st['throws'](
				function () {
					ES.DefinePropertyOrThrow(function () {}, 'name', { configurable: true, value: 'baz' });
				},
				TypeError,
				'nonconfigurable function name can not be defined'
			);
			st.end();
		});

		t.end();
	});

	test('DeletePropertyOrThrow', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.DeletePropertyOrThrow(primitive, 'key', {}); },
				TypeError,
				'O must be an Object'
			);
		});

		forEach(v.nonPropertyKeys, function (nonPropertyKey) {
			t['throws'](
				function () { ES.DeletePropertyOrThrow({}, nonPropertyKey, {}); },
				TypeError,
				debug(nonPropertyKey) + ' is not a Property Key'
			);
		});

		t.test('defines correctly', function (st) {
			var obj = { 'the key': 42 };
			var key = 'the key';

			st.equal(ES.DeletePropertyOrThrow(obj, key), true, 'deletes property successfully');
			st.equal(key in obj, false, 'key is no longer in the object');

			st.end();
		});

		t.test('fails as expected on a frozen object', { skip: !Object.freeze }, function (st) {
			var obj = Object.freeze({ foo: 'bar' });
			st['throws'](
				function () { ES.DeletePropertyOrThrow(obj, 'foo'); },
				TypeError,
				'nonconfigurable key can not be deleted'
			);

			st.end();
		});

		t.test('fails as expected on a function with a nonconfigurable name', { skip: !functionsHaveNames || functionsHaveConfigurableNames }, function (st) {
			st['throws'](
				function () { ES.DeletePropertyOrThrow(function () {}, 'name'); },
				TypeError,
				'nonconfigurable function name can not be deleted'
			);
			st.end();
		});

		t.end();
	});

	test('EnumerableOwnNames', function (t) {
		var obj = testEnumerableOwnNames(t, function (O) { return ES.EnumerableOwnNames(O); });

		t.deepEqual(
			ES.EnumerableOwnNames(obj),
			['own'],
			'returns enumerable own names'
		);

		t.end();
	});

	test('FromPropertyDescriptor', function (t) {
		t.equal(ES.FromPropertyDescriptor(), undefined, 'no value begets undefined');
		t.equal(ES.FromPropertyDescriptor(undefined), undefined, 'undefined value begets undefined');

		forEach(v.nonUndefinedPrimitives, function (primitive) {
			t['throws'](
				function () { ES.FromPropertyDescriptor(primitive); },
				TypeError,
				debug(primitive) + ' is not a Property Descriptor'
			);
		});

		var accessor = v.accessorDescriptor();
		t.deepEqual(ES.FromPropertyDescriptor(accessor), {
			get: accessor['[[Get]]'],
			enumerable: !!accessor['[[Enumerable]]'],
			configurable: !!accessor['[[Configurable]]']
		});

		var mutator = v.mutatorDescriptor();
		t.deepEqual(ES.FromPropertyDescriptor(mutator), {
			set: mutator['[[Set]]'],
			enumerable: !!mutator['[[Enumerable]]'],
			configurable: !!mutator['[[Configurable]]']
		});
		var data = v.dataDescriptor();
		t.deepEqual(ES.FromPropertyDescriptor(data), {
			value: data['[[Value]]'],
			writable: data['[[Writable]]']
		});

		t.deepEqual(ES.FromPropertyDescriptor(v.genericDescriptor()), {
			enumerable: false,
			configurable: true
		});

		var both = v.bothDescriptor();
		t['throws'](
			function () {
				ES.FromPropertyDescriptor({ get: both['[[Get]]'], value: both['[[Value]]'] });
			},
			TypeError,
			'data and accessor descriptors are mutually exclusive'
		);

		t.end();
	});

	test('Get', function (t) {
		t['throws'](function () { return ES.Get('a', 'a'); }, TypeError, 'Throws a TypeError if `O` is not an Object');
		t['throws'](function () { return ES.Get({ 7: 7 }, 7); }, TypeError, 'Throws a TypeError if `P` is not a property key');

		var value = {};
		t.test('Symbols', { skip: !v.hasSymbols }, function (st) {
			var sym = Symbol('sym');
			var obj = {};
			obj[sym] = value;
			st.equal(ES.Get(obj, sym), value, 'returns property `P` if it exists on object `O`');
			st.end();
		});
		t.equal(ES.Get({ a: value }, 'a'), value, 'returns property `P` if it exists on object `O`');
		t.end();
	});

	test('GetIterator', function (t) {
		var arr = [1, 2];
		testIterator(t, ES.GetIterator(arr), arr);

		testIterator(t, ES.GetIterator('abc'), 'abc'.split(''));

		var sentinel = {};
		forEach(v.primitives, function (nonObject) {
			var method = function () {
				return nonObject;
			};
			t['throws'](
				function () { ES.GetIterator(sentinel, method); },
				TypeError,
				debug(nonObject) + ' is not an Object; iterator method must return an Object'
			);
		});

		var i = 0;
		var manualMethod = function () {
			t.equal(this, sentinel, 'receiver is expected object');
			return {
				next: function () {
					var value = arr[i];
					i += 1;
					return {
						done: i > arr.length,
						value: value // eslint-disable-line no-plusplus
					};
				}
			};
		};
		testIterator(t, ES.GetIterator(sentinel, manualMethod), arr);

		t.test('Symbol.iterator', { skip: !v.hasSymbols }, function (st) {
			var m = new Map();
			m.set(1, 'a');
			m.set(2, 'b');

			testIterator(st, ES.GetIterator(m), [[1, 'a'], [2, 'b']]);

			forEach(v.primitives, function (nonObject) {
				var badIterable = {};
				badIterable[Symbol.iterator] = function () {
					return nonObject;
				};
				st['throws'](
					function () { return ES.GetIterator(badIterable); },
					TypeError,
					debug(nonObject) + ' is not an Object; iterator method must return an Object'
				);
			});

			st.end();
		});

		t.end();
	});

	test('GetMethod', function (t) {
		t['throws'](function () { return ES.GetMethod({ 7: 7 }, 7); }, TypeError, 'Throws a TypeError if `P` is not a property key');
		t.equal(ES.GetMethod({}, 'a'), undefined, 'returns undefined in property is undefined');
		t.equal(ES.GetMethod({ a: null }, 'a'), undefined, 'returns undefined if property is null');
		t.equal(ES.GetMethod({ a: undefined }, 'a'), undefined, 'returns undefined if property is undefined');
		var obj = { a: function () {} };
		t['throws'](function () { ES.GetMethod({ a: 'b' }, 'a'); }, TypeError, 'throws TypeError if property exists and is not callable');
		t.equal(ES.GetMethod(obj, 'a'), obj.a, 'returns property if it is callable');
		t.end();
	});

	test('GetOwnPropertyKeys', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.GetOwnPropertyKeys(primitive, 'String'); },
				TypeError,
				'O: ' + debug(primitive) + ' is not an Object'
			);
		});

		t['throws'](
			function () { ES.GetOwnPropertyKeys({}, 'not string or symbol'); },
			TypeError,
			'Type: must be "String" or "Symbol"'
		);

		t.test('Symbols', { skip: !v.hasSymbols }, function (st) {
			var O = { a: 1 };
			O[Symbol.iterator] = true;
			var s = Symbol('test');
			defineProperty(O, s, { enumerable: false, value: true });

			st.deepEqual(
				ES.GetOwnPropertyKeys(O, 'Symbol'),
				[Symbol.iterator, s],
				'works with Symbols, enumerable or not'
			);

			st.end();
		});

		t.test('non-enumerable names', { skip: !defineProperty.oDP }, function (st) {
			var O = { a: 1 };
			defineProperty(O, 'b', { enumerable: false, value: 2 });
			if (v.hasSymbols) {
				O[Symbol.iterator] = true;
			}

			st.deepEqual(
				ES.GetOwnPropertyKeys(O, 'String').sort(),
				['a', 'b'].sort(),
				'works with Strings, enumerable or not'
			);

			st.end();
		});

		t.deepEqual(
			ES.GetOwnPropertyKeys({ a: 1, b: 2 }, 'String').sort(),
			['a', 'b'].sort(),
			'works with enumerable keys'
		);

		t.end();
	});

	test('GetPrototypeFromConstructor', function (t) {
		forEach(v.nonFunctions, function (nonFunction) {
			t['throws'](
				function () { ES.GetPrototypeFromConstructor(nonFunction, '%Array%'); },
				TypeError,
				debug(nonFunction) + ' is not a constructor'
			);
		});

		forEach(arrowFns, function (arrowFn) {
			t['throws'](
				function () { ES.GetPrototypeFromConstructor(arrowFn, '%Array%'); },
				TypeError,
				debug(arrowFn) + ' is not a constructor'
			);
		});

		var f = function () {};
		t.equal(
			ES.GetPrototypeFromConstructor(f, '%Array.prototype%'),
			f.prototype,
			'function with normal `prototype` property returns it'
		);
		forEach([true, 'foo', 42], function (truthyPrimitive) {
			f.prototype = truthyPrimitive;
			t.equal(
				ES.GetPrototypeFromConstructor(f, '%Array.prototype%'),
				Array.prototype,
				'function with non-object `prototype` property (' + debug(truthyPrimitive) + ') returns default intrinsic'
			);
		});

		t.end();
	});

	test('GetSubstitution', function (t) {
		forEach(v.nonStrings, function (nonString) {
			t['throws'](
				function () { ES.GetSubstitution(nonString, '', 0, [], ''); },
				TypeError,
				'`matched`: ' + debug(nonString) + ' is not a String'
			);

			t['throws'](
				function () { ES.GetSubstitution('', nonString, 0, [], ''); },
				TypeError,
				'`str`: ' + debug(nonString) + ' is not a String'
			);

			t['throws'](
				function () { ES.GetSubstitution('', '', 0, [], nonString); },
				TypeError,
				'`replacement`: ' + debug(nonString) + ' is not a String'
			);

			if (canDistinguishSparseFromUndefined || typeof nonString !== 'undefined') {
				t['throws'](
					function () { ES.GetSubstitution('', '', 0, [nonString], ''); },
					TypeError,
					'`captures`: ' + debug([nonString]) + ' is not an Array of strings'
				);
			}
		});

		forEach(v.notNonNegativeIntegers, function (nonNonNegativeInteger) {
			t['throws'](
				function () { ES.GetSubstitution('', '', nonNonNegativeInteger, [], ''); },
				TypeError,
				'`position`: ' + debug(nonNonNegativeInteger) + ' is not a non-negative integer'
			);
		});

		forEach(v.nonArrays, function (nonArray) {
			t['throws'](
				function () { ES.GetSubstitution('', '', 0, nonArray, ''); },
				TypeError,
				'`captures`: ' + debug(nonArray) + ' is not an Array'
			);
		});

		t.equal(
			ES.GetSubstitution('def', 'abcdefghi', 3, [], '123'),
			'123',
			'returns the substitution'
		);
		t.equal(
			ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], '$$2$'),
			'$2$',
			'supports $$, and trailing $'
		);

		t.equal(
			ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], '>$&<'),
			'>abcdef<',
			'supports $&'
		);

		t.equal(
			ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], '>$`<'),
			'><',
			'supports $` at position 0'
		);
		t.equal(
			ES.GetSubstitution('def', 'abcdefghi', 3, [], '>$`<'),
			'>ab<',
			'supports $` at position > 0'
		);

		t.equal(
			ES.GetSubstitution('def', 'abcdefghi', 7, [], ">$'<"),
			'><',
			"supports $' at a position where there's less than `matched.length` chars left"
		);
		t.equal(
			ES.GetSubstitution('def', 'abcdefghi', 3, [], ">$'<"),
			'>ghi<',
			"supports $' at a position where there's more than `matched.length` chars left"
		);

		for (var i = 0; i < 100; i += 1) {
			var captures = [];
			captures[i] = 'test';
			if (i > 0) {
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], '>$' + i + '<'),
					'>undefined<',
					'supports $' + i + ' with no captures'
				);
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], '>$' + i),
					'>undefined',
					'supports $' + i + ' at the end of the replacement, with no captures'
				);
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, captures, '>$' + i + '<'),
					'><',
					'supports $' + i + ' with a capture at that index'
				);
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, captures, '>$' + i),
					'>',
					'supports $' + i + ' at the end of the replacement, with a capture at that index'
				);
			}
			if (i < 10) {
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], '>$0' + i + '<'),
					i === 0 ? '><' : '>undefined<',
					'supports $0' + i + ' with no captures'
				);
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], '>$0' + i),
					i === 0 ? '>' : '>undefined',
					'supports $0' + i + ' at the end of the replacement, with no captures'
				);
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, captures, '>$0' + i + '<'),
					'><',
					'supports $0' + i + ' with a capture at that index'
				);
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, captures, '>$0' + i),
					'>',
					'supports $0' + i + ' at the end of the replacement, with a capture at that index'
				);
			}
		}

		t.end();
	});

	test('GetV', function (t) {
		t['throws'](function () { return ES.GetV({ 7: 7 }, 7); }, TypeError, 'Throws a TypeError if `P` is not a property key');
		var obj = { a: function () {} };
		t.equal(ES.GetV(obj, 'a'), obj.a, 'returns property if it exists');
		t.equal(ES.GetV(obj, 'b'), undefined, 'returns undefiend if property does not exist');
		t.end();
	});

	test('HasOwnProperty', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.HasOwnProperty(primitive, 'key'); },
				TypeError,
				debug(primitive) + ' is not an Object'
			);
		});

		forEach(v.nonPropertyKeys, function (nonKey) {
			t['throws'](
				function () { ES.HasOwnProperty({}, nonKey); },
				TypeError,
				debug(nonKey) + ' is not a Property Key'
			);
		});

		t.equal(ES.HasOwnProperty({}, 'toString'), false, 'inherited properties are not own');
		t.equal(
			ES.HasOwnProperty({ toString: 1 }, 'toString'),
			true,
			'shadowed inherited own properties are own'
		);
		t.equal(ES.HasOwnProperty({ a: 1 }, 'a'), true, 'own properties are own');

		t.end();
	});

	test('HasProperty', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.HasProperty(primitive, 'key'); },
				TypeError,
				debug(primitive) + ' is not an Object'
			);
		});

		forEach(v.nonPropertyKeys, function (nonKey) {
			t['throws'](
				function () { ES.HasProperty({}, nonKey); },
				TypeError,
				debug(nonKey) + ' is not a Property Key'
			);
		});

		t.equal(ES.HasProperty({}, 'nope'), false, 'object does not have nonexistent properties');
		t.equal(ES.HasProperty({}, 'toString'), true, 'object has inherited properties');
		t.equal(
			ES.HasProperty({ toString: 1 }, 'toString'),
			true,
			'object has shadowed inherited own properties'
		);
		t.equal(ES.HasProperty({ a: 1 }, 'a'), true, 'object has own properties');

		t.end();
	});

	test('InstanceofOperator', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.InstanceofOperator(primitive, function () {}); },
				TypeError,
				debug(primitive) + ' is not an object'
			);
		});

		forEach(v.nonFunctions, function (nonFunction) {
			t['throws'](
				function () { ES.InstanceofOperator({}, nonFunction); },
				TypeError,
				debug(nonFunction) + ' is not callable'
			);
		});

		var C = function C() {};
		var D = function D() {};

		t.equal(ES.InstanceofOperator(new C(), C), true, 'constructor function has an instance of itself');
		t.equal(ES.InstanceofOperator(new D(), C), false, 'constructor/instance mismatch is false');
		t.equal(ES.InstanceofOperator(new C(), D), false, 'instance/constructor mismatch is false');
		t.equal(ES.InstanceofOperator({}, C), false, 'plain object is not an instance of a constructor');
		t.equal(ES.InstanceofOperator({}, Object), true, 'plain object is an instance of Object');

		t.test('Symbol.hasInstance', { skip: !v.hasSymbols || !Symbol.hasInstance }, function (st) {
			st.plan(5);

			var O = {};
			var C2 = function () {};
			st.equal(ES.InstanceofOperator(O, C2), false, 'O is not an instance of C2');

			defineProperty(C2, Symbol.hasInstance, {
				configurable: true,
				value: function (obj) {
					st.equal(this, C2, 'hasInstance receiver is C2');
					st.equal(obj, O, 'hasInstance argument is O');

					return {}; // testing coercion to boolean
				}
			});

			st.equal(ES.InstanceofOperator(O, C2), true, 'O is now an instance of C2');

			defineProperty(C2, Symbol.hasInstance, {
				configurable: true,
				value: undefined
			});

			st.equal(ES.InstanceofOperator(O, C2), false, 'O is no longer an instance of C2');

			st.end();
		});

		t.end();
	});

	test('Invoke', function (t) {
		forEach(v.nonPropertyKeys, function (nonKey) {
			t['throws'](
				function () { ES.Invoke({}, nonKey); },
				TypeError,
				debug(nonKey) + ' is not a Property Key'
			);
		});

		t['throws'](
			function () { ES.Invoke({ o: false }, 'o'); },
			TypeError,
			'fails on a non-function'
		);

		forEach(v.nonArrays, function (nonArray) {
			t['throws'](
				function () { ES.Invoke({}, '', nonArray); },
				TypeError,
				debug(nonArray) + ' is not an Array'
			);
		});

		t.test('invoked callback', function (st) {
			var aValue = {};
			var bValue = {};
			var obj = {
				f: function (a) {
					st.equal(arguments.length, 2, '2 args passed');
					st.equal(a, aValue, 'first arg is correct');
					st.equal(arguments[1], bValue, 'second arg is correct');
				}
			};
			st.plan(3);
			ES.Invoke(obj, 'f', [aValue, bValue]);
		});

		t.end();
	});

	test('IsArray', function (t) {
		t.equal(true, ES.IsArray([]), '[] is array');
		t.equal(false, ES.IsArray({}), '{} is not array');
		t.equal(false, ES.IsArray({ length: 1, 0: true }), 'arraylike object is not array');
		forEach(v.objects.concat(v.primitives), function (value) {
			t.equal(false, ES.IsArray(value), debug(value) + ' is not array');
		});
		t.end();
	});

	test('IsConcatSpreadable', function (t) {
		forEach(v.primitives, function (primitive) {
			t.equal(ES.IsConcatSpreadable(primitive), false, debug(primitive) + ' is not an Object');
		});

		var hasSymbolConcatSpreadable = v.hasSymbols && Symbol.isConcatSpreadable;
		t.test('Symbol.isConcatSpreadable', { skip: !hasSymbolConcatSpreadable }, function (st) {
			forEach(v.falsies, function (falsy) {
				var obj = {};
				obj[Symbol.isConcatSpreadable] = falsy;
				st.equal(
					ES.IsConcatSpreadable(obj),
					false,
					'an object with ' + debug(falsy) + ' as Symbol.isConcatSpreadable is not concat spreadable'
				);
			});

			forEach(v.truthies, function (truthy) {
				var obj = {};
				obj[Symbol.isConcatSpreadable] = truthy;
				st.equal(
					ES.IsConcatSpreadable(obj),
					true,
					'an object with ' + debug(truthy) + ' as Symbol.isConcatSpreadable is concat spreadable'
				);
			});

			st.end();
		});

		forEach(v.objects, function (object) {
			t.equal(
				ES.IsConcatSpreadable(object),
				false,
				'non-array without Symbol.isConcatSpreadable is not concat spreadable'
			);
		});

		t.equal(ES.IsConcatSpreadable([]), true, 'arrays are concat spreadable');

		t.end();
	});

	test('IsConstructor', function (t) {
		t.equal(true, ES.IsConstructor(function () {}), 'function is constructor');
		t.equal(false, ES.IsConstructor(/a/g), 'regex is not constructor');
		forEach(v.objects, function (object) {
			t.equal(false, ES.IsConstructor(object), object + ' object is not constructor');
		});

		try {
			var arrow = Function('return () => {}')(); // eslint-disable-line no-new-func
			t.equal(ES.IsConstructor(arrow), false, 'arrow function is not constructor');
		} catch (e) {
			t.comment('SKIP: arrow function syntax not supported.');
		}

		try {
			var foo = Function('return class Foo {}')(); // eslint-disable-line no-new-func
			t.equal(ES.IsConstructor(foo), true, 'class is constructor');
		} catch (e) {
			t.comment('SKIP: class syntax not supported.');
		}

		if (typeof Reflect !== 'object' || typeof Proxy !== 'function' || has(Proxy, 'prototype')) {
			t.comment('SKIP: Proxy is constructor');
		} else {
			t.equal(ES.IsConstructor(Proxy), true, 'Proxy is constructor');
		}

		t.end();
	});

	test('IsExtensible', function (t) {
		forEach(v.objects, function (object) {
			t.equal(true, ES.IsExtensible(object), debug(object) + ' object is extensible');
		});
		forEach(v.primitives, function (primitive) {
			t.equal(false, ES.IsExtensible(primitive), debug(primitive) + ' is not extensible');
		});
		if (Object.preventExtensions) {
			t.equal(false, ES.IsExtensible(Object.preventExtensions({})), 'object with extensions prevented is not extensible');
		}
		t.end();
	});

	test('IsPromise', { skip: typeof Promise !== 'function' }, function (t) {
		forEach(v.objects.concat(v.primitives), function (nonPromise) {
			t.equal(ES.IsPromise(nonPromise), false, debug(nonPromise) + ' is not a Promise');
		});

		var thenable = { then: Promise.prototype.then };
		t.equal(ES.IsPromise(thenable), false, 'generic thenable is not a Promise');

		t.equal(ES.IsPromise(Promise.resolve()), true, 'Promise is a Promise');

		t.end();
	});

	test('IsPropertyDescriptor', function (t) {
		forEach(v.primitives, function (primitive) {
			t.equal(
				ES.IsPropertyDescriptor(primitive),
				false,
				debug(primitive) + ' is not a Property Descriptor'
			);
		});

		t.equal(ES.IsPropertyDescriptor({ invalid: true }), false, 'invalid keys not allowed on a Property Descriptor');

		t.equal(ES.IsPropertyDescriptor({}), true, 'empty object is an incomplete Property Descriptor');

		t.equal(ES.IsPropertyDescriptor(v.accessorDescriptor()), true, 'accessor descriptor is a Property Descriptor');
		t.equal(ES.IsPropertyDescriptor(v.mutatorDescriptor()), true, 'mutator descriptor is a Property Descriptor');
		t.equal(ES.IsPropertyDescriptor(v.dataDescriptor()), true, 'data descriptor is a Property Descriptor');
		t.equal(ES.IsPropertyDescriptor(v.genericDescriptor()), true, 'generic descriptor is a Property Descriptor');

		t['throws'](
			function () { ES.IsPropertyDescriptor(v.bothDescriptor()); },
			TypeError,
			'a Property Descriptor can not be both a Data and an Accessor Descriptor'
		);

		t['throws'](
			function () { ES.IsPropertyDescriptor(v.bothDescriptorWritable()); },
			TypeError,
			'a Property Descriptor can not be both a Data and an Accessor Descriptor'
		);

		t.end();
	});

	test('IsPropertyKey', function (t) {
		forEach(v.numbers.concat(v.objects), function (notKey) {
			t.equal(false, ES.IsPropertyKey(notKey), debug(notKey) + ' is not property key');
		});

		t.equal(true, ES.IsPropertyKey('foo'), 'string is property key');

		forEach(v.symbols, function (symbol) {
			t.equal(true, ES.IsPropertyKey(symbol), debug(symbol) + ' is property key');
		});
		t.end();
	});

	test('IsRegExp', function (t) {
		forEach([/a/g, new RegExp('a', 'g')], function (regex) {
			t.equal(true, ES.IsRegExp(regex), regex + ' is regex');
		});

		forEach(v.objects.concat(v.primitives), function (nonRegex) {
			t.equal(false, ES.IsRegExp(nonRegex), debug(nonRegex) + ' is not regex');
		});

		t.test('Symbol.match', { skip: !v.hasSymbols || !Symbol.match }, function (st) {
			var obj = {};
			obj[Symbol.match] = true;
			st.equal(true, ES.IsRegExp(obj), 'object with truthy Symbol.match is regex');

			var regex = /a/;
			defineProperty(regex, Symbol.match, { value: false });
			st.equal(false, ES.IsRegExp(regex), 'regex with falsy Symbol.match is not regex');

			st.end();
		});

		t.end();
	});

	test('IsInteger', function (t) {
		for (var i = -100; i < 100; i += 10) {
			t.equal(true, ES.IsInteger(i), i + ' is integer');
			t.equal(false, ES.IsInteger(i + 0.2), (i + 0.2) + ' is not integer');
		}
		t.equal(true, ES.IsInteger(-0), '-0 is integer');
		var notInts = v.nonNumbers.concat(v.nonIntegerNumbers, v.infinities, [NaN, [], new Date()]);
		forEach(notInts, function (notInt) {
			t.equal(false, ES.IsInteger(notInt), debug(notInt) + ' is not integer');
		});
		t.equal(false, ES.IsInteger(v.uncoercibleObject), 'uncoercibleObject is not integer');
		t.end();
	});

	test('IteratorNext', function (t) {
		forEach(v.primitives, function (nonObject) {
			t['throws'](
				function () { ES.IteratorNext(nonObject); },
				TypeError,
				debug(nonObject) + ' is not an Object'
			);

			t['throws'](
				function () { ES.IteratorNext({ next: function () { return nonObject; } }); },
				TypeError,
				'`next()` returns ' + debug(nonObject) + ', which is not an Object'
			);
		});

		var iterator = {
			next: function (value) {
				return [arguments.length, value];
			}
		};
		t.deepEqual(
			ES.IteratorNext(iterator),
			[0, undefined],
			'returns expected value from `.next()`; `next` receives expected 0 arguments'
		);
		t.deepEqual(
			ES.IteratorNext(iterator, iterator),
			[1, iterator],
			'returns expected value from `.next()`; `next` receives expected 1 argument'
		);

		t.end();
	});

	test('IteratorComplete', function (t) {
		forEach(v.primitives, function (nonObject) {
			t['throws'](
				function () { ES.IteratorComplete(nonObject); },
				TypeError,
				debug(nonObject) + ' is not an Object'
			);
		});

		forEach(v.truthies, function (truthy) {
			t.equal(ES.IteratorComplete({ done: truthy }), true, '{ done: ' + debug(truthy) + ' } is true');
		});

		forEach(v.falsies, function (falsy) {
			t.equal(ES.IteratorComplete({ done: falsy }), false, '{ done: ' + debug(falsy) + ' } is false');
		});

		t.end();
	});

	test('IteratorValue', function (t) {
		forEach(v.primitives, function (nonObject) {
			t['throws'](
				function () { ES.IteratorValue(nonObject); },
				TypeError,
				debug(nonObject) + ' is not an Object'
			);
		});

		var sentinel = {};
		t.equal(ES.IteratorValue({ value: sentinel }), sentinel, 'Gets `.value` off the object');

		t.end();
	});

	test('IteratorStep', function (t) {
		t.deepEqual(
			ES.IteratorStep({
				next: function () {
					return {
						done: false,
						value: [1, arguments.length]
					};
				}
			}),
			{ done: false, value: [1, 0] },
			'not-done iterator result yields iterator result'
		);
		t.deepEqual(
			ES.IteratorStep({
				next: function () {
					return {
						done: true,
						value: [2, arguments.length]
					};
				}
			}),
			false,
			'done iterator result yields false'
		);

		t.end();
	});

	test('IteratorClose', function (t) {
		forEach(v.primitives, function (nonObject) {
			t['throws'](
				function () { ES.IteratorClose(nonObject); },
				TypeError,
				debug(nonObject) + ' is not an Object'
			);

			t['throws'](
				function () { ES.IteratorClose({ 'return': function () { return nonObject; } }, function () {}); },
				TypeError,
				'`.return` returns ' + debug(nonObject) + ', which is not an Object'
			);
		});

		forEach(v.nonFunctions, function (nonFunction) {
			t['throws'](
				function () { ES.IteratorClose({}, nonFunction); },
				TypeError,
				debug(nonFunction) + ' is not a thunk for a Completion Record'
			);

			if (nonFunction != null) {
				t['throws'](
					function () { ES.IteratorClose({ 'return': nonFunction }, function () {}); },
					TypeError,
					'`.return` of ' + debug(nonFunction) + ' is not a Function'
				);
			}
		});

		var sentinel = {};
		t.equal(
			ES.IteratorClose({ 'return': undefined }, function () { return sentinel; }),
			sentinel,
			'when `.return` is `undefined`, invokes and returns the completion thunk'
		);

		/* eslint no-throw-literal: 0 */
		t['throws'](
			function () { ES.IteratorClose({ 'return': function () { throw sentinel; } }, function () {}); },
			sentinel,
			'`.return` that throws, when completionThunk does not, throws exception from `.return`'
		);
		t['throws'](
			function () { ES.IteratorClose({ 'return': function () { throw sentinel; } }, function () { throw -1; }); },
			-1,
			'`.return` that throws, when completionThunk does too, throws exception from completionThunk'
		);
		t['throws'](
			function () { ES.IteratorClose({ 'return': function () { } }, function () { throw -1; }); },
			-1,
			'`.return` that does not throw, when completionThunk does, throws exception from completionThunk'
		);

		t.equal(
			ES.IteratorClose({ 'return': function () { return sentinel; } }, function () { return 42; }),
			42,
			'when `.return` and completionThunk do not throw, and `.return` returns an Object, returns completionThunk'
		);

		t.end();
	});

	test('ObjectCreate', function (t) {
		forEach(v.nonNullPrimitives, function (value) {
			t['throws'](
				function () { ES.ObjectCreate(value); },
				TypeError,
				debug(value) + ' is not null, or an object'
			);
		});

		t.test('proto arg', function (st) {
			var Parent = function Parent() {};
			Parent.prototype.foo = {};
			var child = ES.ObjectCreate(Parent.prototype);
			st.equal(child instanceof Parent, true, 'child is instanceof Parent');
			st.equal(child.foo, Parent.prototype.foo, 'child inherits properties from Parent.prototype');

			st.end();
		});

		t.test('internal slots arg', function (st) {
			st.doesNotThrow(function () { ES.ObjectCreate({}, []); }, 'an empty slot list is valid');

			st['throws'](
				function () { ES.ObjectCreate({}, ['a']); },
				SyntaxError,
				'internal slots are not supported'
			);

			st.end();
		});

		t.test('null proto', { skip: !Object.create && !$setProto }, function (st) {
			st.equal('toString' in {}, true, 'normal objects have toString');
			st.equal('toString' in ES.ObjectCreate(null), false, 'makes a null object');

			st.end();
		});

		t.test('null proto when no native Object.create', { skip: Object.create || $setProto }, function (st) {
			st['throws'](
				function () { ES.ObjectCreate(null); },
				SyntaxError,
				'without a native Object.create, can not create null objects'
			);

			st.end();
		});

		t.end();
	});

	test('OrdinaryCreateFromConstructor', function (t) {
		forEach(v.nonFunctions, function (nonFunction) {
			t['throws'](
				function () { ES.OrdinaryCreateFromConstructor(nonFunction, '%Array.prototype%'); },
				TypeError,
				debug(nonFunction) + ' is not a constructor'
			);
		});

		forEach(arrowFns, function (arrowFn) {
			t['throws'](
				function () { ES.OrdinaryCreateFromConstructor(arrowFn, '%Array.prototype%'); },
				TypeError,
				debug(arrowFn) + ' is not a constructor'
			);
		});

		t.test('proto arg', function (st) {
			var Parent = function Parent() {};
			Parent.prototype.foo = {};
			var child = ES.OrdinaryCreateFromConstructor(Parent, '%Array.prototype%');
			st.equal(child instanceof Parent, true, 'child is instanceof Parent');
			st.equal(child instanceof Array, false, 'child is not instanceof Array');
			st.equal(child.foo, Parent.prototype.foo, 'child inherits properties from Parent.prototype');

			st.end();
		});

		t.test('internal slots arg', function (st) {
			st.doesNotThrow(
				function () { ES.OrdinaryCreateFromConstructor(function () {}, '%Array.prototype%', []); },
				'an empty slot list is valid'
			);

			st['throws'](
				function () { ES.OrdinaryCreateFromConstructor(function () {}, '%Array.prototype%', ['a']); },
				SyntaxError,
				'internal slots are not supported'
			);

			st.end();
		});

		t.end();
	});

	test('OrdinaryGetOwnProperty', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.OrdinaryGetOwnProperty(primitive, ''); },
				TypeError,
				'O: ' + debug(primitive) + ' is not an Object'
			);
		});
		forEach(v.nonPropertyKeys, function (nonPropertyKey) {
			t['throws'](
				function () { ES.OrdinaryGetOwnProperty({}, nonPropertyKey); },
				TypeError,
				'P: ' + debug(nonPropertyKey) + ' is not a Property Key'
			);
		});

		t.equal(ES.OrdinaryGetOwnProperty({}, 'not in the object'), undefined, 'missing property yields undefined');
		t.equal(ES.OrdinaryGetOwnProperty({}, 'toString'), undefined, 'inherited non-own property yields undefined');

		t.deepEqual(
			ES.OrdinaryGetOwnProperty({ a: 1 }, 'a'),
			ES.ToPropertyDescriptor({
				configurable: true,
				enumerable: true,
				value: 1,
				writable: true
			}),
			'own assigned data property yields expected descriptor'
		);

		t.deepEqual(
			ES.OrdinaryGetOwnProperty(/a/, 'lastIndex'),
			ES.ToPropertyDescriptor({
				configurable: false,
				enumerable: false,
				value: 0,
				writable: true
			}),
			'regex lastIndex yields expected descriptor'
		);

		t.deepEqual(
			ES.OrdinaryGetOwnProperty([], 'length'),
			ES.ToPropertyDescriptor({
				configurable: false,
				enumerable: false,
				value: 0,
				writable: true
			}),
			'array length yields expected descriptor'
		);

		if (!Object.isFrozen || !Object.isFrozen(Object.prototype)) {
			t.deepEqual(
				ES.OrdinaryGetOwnProperty(Object.prototype, 'toString'),
				ES.ToPropertyDescriptor({
					configurable: true,
					enumerable: false,
					value: Object.prototype.toString,
					writable: true
				}),
				'own non-enumerable data property yields expected descriptor'
			);
		}

		t.test('ES5+', { skip: !defineProperty.oDP }, function (st) {
			var O = {};
			defineProperty(O, 'foo', {
				configurable: false,
				enumerable: false,
				value: O,
				writable: true
			});

			st.deepEqual(
				ES.OrdinaryGetOwnProperty(O, 'foo'),
				ES.ToPropertyDescriptor({
					configurable: false,
					enumerable: false,
					value: O,
					writable: true
				}),
				'defined own property yields expected descriptor'
			);

			st.end();
		});

		t.end();
	});

	test('OrdinaryDefineOwnProperty', { skip: !getOwnPropertyDescriptor }, function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.OrdinaryDefineOwnProperty(primitive, {}, []); },
				TypeError,
				'O: ' + debug(primitive) + ' is not an Object'
			);
		});
		forEach(v.nonPropertyKeys, function (nonPropertyKey) {
			t['throws'](
				function () { ES.OrdinaryDefineOwnProperty({}, nonPropertyKey, v.genericDescriptor()); },
				TypeError,
				'P: ' + debug(nonPropertyKey) + ' is not a Property Key'
			);
		});
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.OrdinaryDefineOwnProperty(primitive, '', v.genericDescriptor()); },
				TypeError,
				'Desc: ' + debug(primitive) + ' is not a Property Descriptor'
			);
		});

		var O = {};
		var P = 'property key';
		var Desc = v.accessorDescriptor();
		t.equal(
			ES.OrdinaryDefineOwnProperty(O, P, Desc),
			true,
			'operation is successful'
		);
		t.deepEqual(
			getOwnPropertyDescriptor(O, P),
			ES.FromPropertyDescriptor(ES.CompletePropertyDescriptor(Desc)),
			'expected property descriptor is defined'
		);

		t.end();
	});

	test('OrdinaryHasInstance', function (t) {
		forEach(v.nonFunctions, function (nonFunction) {
			t.equal(ES.OrdinaryHasInstance(nonFunction, {}), false, debug(nonFunction) + ' is not callable');
		});

		forEach(v.primitives, function (primitive) {
			t.equal(ES.OrdinaryHasInstance(function () {}, primitive), false, debug(primitive) + ' is not an object');
		});

		var C = function C() {};
		var D = function D() {};
		t.equal(ES.OrdinaryHasInstance(C, new C()), true, 'constructor function has an instance of itself');
		t.equal(ES.OrdinaryHasInstance(C, new D()), false, 'constructor/instance mismatch is false');
		t.equal(ES.OrdinaryHasInstance(D, new C()), false, 'instance/constructor mismatch is false');
		t.equal(ES.OrdinaryHasInstance(C, {}), false, 'plain object is not an instance of a constructor');
		t.equal(ES.OrdinaryHasInstance(Object, {}), true, 'plain object is an instance of Object');

		t.end();
	});

	test('OrdinaryHasProperty', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.OrdinaryHasProperty(primitive, ''); },
				TypeError,
				debug(primitive) + ' is not an object'
			);
		});
		forEach(v.nonPropertyKeys, function (nonPropertyKey) {
			t['throws'](
				function () { ES.OrdinaryHasProperty({}, nonPropertyKey); },
				TypeError,
				'P: ' + debug(nonPropertyKey) + ' is not a Property Key'
			);
		});

		t.equal(ES.OrdinaryHasProperty({ a: 1 }, 'a'), true, 'own property is true');
		t.equal(ES.OrdinaryHasProperty({}, 'toString'), true, 'inherited property is true');
		t.equal(ES.OrdinaryHasProperty({}, 'nope'), false, 'absent property is false');

		t.end();
	});

	test('QuoteJSONString', function (t) {
		forEach(v.nonStrings, function (nonString) {
			t['throws'](
				function () { ES.QuoteJSONString(nonString); },
				TypeError,
				debug(nonString) + ' is not a String'
			);
		});

		t.equal(ES.QuoteJSONString(''), '""', '"" gets properly JSON-quoted');
		t.equal(ES.QuoteJSONString('a'), '"a"', '"a" gets properly JSON-quoted');
		t.equal(ES.QuoteJSONString('"'), '"\\""', '"\\"" gets properly JSON-quoted');
		t.equal(ES.QuoteJSONString('\b'), '"\\b"', '"\\b" gets properly JSON-quoted');
		t.equal(ES.QuoteJSONString('\t'), '"\\t"', '"\\t" gets properly JSON-quoted');
		t.equal(ES.QuoteJSONString('\n'), '"\\n"', '"\\n" gets properly JSON-quoted');
		t.equal(ES.QuoteJSONString('\f'), '"\\f"', '"\\f" gets properly JSON-quoted');
		t.equal(ES.QuoteJSONString('\r'), '"\\r"', '"\\r" gets properly JSON-quoted');
		t.equal(ES.QuoteJSONString('\\'), '"\\\\"', '"\\\\" gets properly JSON-quoted');
		t.equal(ES.QuoteJSONString('\\'), '"\\\\"', '"\\\\" gets properly JSON-quoted');
		t.equal(ES.QuoteJSONString('\u0019'), '"\\u0019"', '"\\u0019" gets properly JSON-quoted');

		t.end();
	});

	test('RegExpCreate', function (t) {
		forEach(v.nonStrings, function (nonString) {
			if (typeof nonString !== 'symbol') {
				var p = typeof nonString === 'undefined' ? '' : nonString;
				t.equal(
					String(ES.RegExpCreate(p, 'g')),
					'/' + (String(p) || '(?:)') + '/g',
					debug(nonString) + ' becomes `/' + String(p) + '/g`'
				);
			}
		});

		t.deepEqual(ES.RegExpCreate(), new RegExp(), 'undefined pattern and flags yields empty regex');

		t.end();
	});

	test('RegExpExec', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.RegExpExec(primitive); },
				TypeError,
				'"R" argument must be an object; ' + debug(primitive) + ' is not'
			);
		});

		forEach(v.nonStrings, function (nonString) {
			t['throws'](
				function () { ES.RegExpExec({}, nonString); },
				TypeError,
				'"S" argument must be a String; ' + debug(nonString) + ' is not'
			);
		});

		t.test('gets and calls a callable "exec"', function (st) {
			var str = '123';
			var o = {
				exec: function (S) {
					st.equal(this, o, '"exec" receiver is R');
					st.equal(S, str, '"exec" argument is S');

					return null;
				}
			};
			st.plan(2);
			ES.RegExpExec(o, str);
			st.end();
		});

		t.test('throws if a callable "exec" returns a non-null non-object', function (st) {
			var str = '123';
			st.plan(v.nonNullPrimitives.length);
			forEach(v.nonNullPrimitives, function (nonNullPrimitive) {
				st['throws'](
					function () { ES.RegExpExec({ exec: function () { return nonNullPrimitive; } }, str); },
					TypeError,
					'"exec" method must return `null` or an Object; ' + debug(nonNullPrimitive) + ' is not'
				);
			});
			st.end();
		});

		t.test('actual regex that should match against a string', function (st) {
			var S = 'aabc';
			var R = /a/g;
			var match1 = ES.RegExpExec(R, S);
			var expected1 = assign(['a'], kludgeMatch(R, { index: 0, input: S }));
			var match2 = ES.RegExpExec(R, S);
			var expected2 = assign(['a'], kludgeMatch(R, { index: 1, input: S }));
			var match3 = ES.RegExpExec(R, S);
			st.deepEqual(match1, expected1, 'match object 1 is as expected');
			st.deepEqual(match2, expected2, 'match object 2 is as expected');
			st.equal(match3, null, 'match 3 is null as expected');
			st.end();
		});

		t.test('actual regex that should match against a string, with shadowed "exec"', function (st) {
			var S = 'aabc';
			var R = /a/g;
			defineProperty(R, 'exec', { value: undefined });
			var match1 = ES.RegExpExec(R, S);
			var expected1 = assign(['a'], kludgeMatch(R, { index: 0, input: S }));
			var match2 = ES.RegExpExec(R, S);
			var expected2 = assign(['a'], kludgeMatch(R, { index: 1, input: S }));
			var match3 = ES.RegExpExec(R, S);
			st.deepEqual(match1, expected1, 'match object 1 is as expected');
			st.deepEqual(match2, expected2, 'match object 2 is as expected');
			st.equal(match3, null, 'match 3 is null as expected');
			st.end();
		});
		t.end();
	});

	test('RequireObjectCoercible', function (t) {
		t.equal(false, 'CheckObjectCoercible' in ES, 'CheckObjectCoercible -> RequireObjectCoercible in ES6');
		t['throws'](function () { return ES.RequireObjectCoercible(undefined); }, TypeError, 'undefined throws');
		t['throws'](function () { return ES.RequireObjectCoercible(null); }, TypeError, 'null throws');
		var isCoercible = function (value) {
			t.doesNotThrow(function () { return ES.RequireObjectCoercible(value); }, debug(value) + ' does not throw');
		};
		forEach(v.objects.concat(v.nonNullPrimitives), isCoercible);
		t.end();
	});

	test('SameValueZero', function (t) {
		t.equal(true, ES.SameValueZero(NaN, NaN), 'NaN is SameValueZero as NaN');
		t.equal(true, ES.SameValueZero(0, -0), '+0 is SameValueZero as -0');
		forEach(v.objects.concat(v.primitives), function (val) {
			t.equal(val === val, ES.SameValueZero(val, val), debug(val) + ' is SameValueZero to itself');
		});
		t.end();
	});

	test('Set', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.Set(primitive, '', null, false); },
				TypeError,
				debug(primitive) + ' is not an Object'
			);
		});

		forEach(v.nonPropertyKeys, function (nonKey) {
			t['throws'](
				function () { ES.Set({}, nonKey, null, false); },
				TypeError,
				debug(nonKey) + ' is not a Property Key'
			);
		});

		forEach(v.nonBooleans, function (nonBoolean) {
			t['throws'](
				function () { ES.Set({}, '', null, nonBoolean); },
				TypeError,
				debug(nonBoolean) + ' is not a Boolean'
			);
		});

		var o = {};
		var value = {};
		ES.Set(o, 'key', value, true);
		t.deepEqual(o, { key: value }, 'key is set');

		t.test('nonwritable', { skip: !defineProperty.oDP }, function (st) {
			var obj = { a: value };
			defineProperty(obj, 'a', { writable: false });

			st['throws'](
				function () { ES.Set(obj, 'a', {}, true); },
				TypeError,
				'can not Set nonwritable property'
			);

			st.doesNotThrow(
				function () {
					st.equal(ES.Set(obj, 'a', {}, false), false, 'unsuccessful Set returns false');
				},
				'setting Throw to false prevents an exception'
			);

			st.end();
		});

		t.test('nonconfigurable', { skip: !defineProperty.oDP }, function (st) {
			var obj = { a: value };
			defineProperty(obj, 'a', { configurable: false });

			st.equal(ES.Set(obj, 'a', value, true), true, 'successful Set returns true');
			st.deepEqual(obj, { a: value }, 'key is set');

			st.end();
		});

		t.test('doesn’t call [[Get]] in conforming strict mode environments', { skip: noThrowOnStrictViolation }, function (st) {
			var getterCalled = false;
			var setterCalls = 0;
			var obj = {};
			defineProperty(obj, 'a', {
				get: function () {
					getterCalled = true;
				},
				set: function () {
					setterCalls += 1;
				}
			});

			st.equal(ES.Set(obj, 'a', value, false), true, 'successful Set returns true');
			st.equal(setterCalls, 1, 'setter was called once');
			st.equal(getterCalled, false, 'getter was not called');

			st.end();
		});

		t.end();
	});

	test('SetFunctionName', function (t) {
		forEach(v.nonFunctions, function (nonFunction) {
			t['throws'](
				function () { ES.SetFunctionName(nonFunction, ''); },
				TypeError,
				debug(nonFunction) + ' is not a Function'
			);
		});

		t.test('non-extensible function', { skip: !Object.preventExtensions }, function (st) {
			var f = getNamelessFunction();
			Object.preventExtensions(f);
			st['throws'](
				function () { ES.SetFunctionName(f, ''); },
				TypeError,
				'throws on a non-extensible function'
			);
			st.end();
		});

		t.test('has an own name property', { skip: !functionsHaveNames }, function (st) {
			st['throws'](
				function () { ES.SetFunctionName(function g() {}, ''); },
				TypeError,
				'throws if function has an own `name` property'
			);
			st.end();
		});

		forEach(v.nonPropertyKeys, function (nonPropertyKey) {
			t['throws'](
				function () { ES.SetFunctionName(getNamelessFunction(), nonPropertyKey); },
				TypeError,
				debug(nonPropertyKey) + ' is not a Symbol or String'
			);
		});

		t.test('symbols', { skip: !v.hasSymbols || has(getNamelessFunction(), 'name') }, function (st) {
			var pairs = [
				[Symbol(), ''],
				[Symbol(undefined), ''],
				[Symbol(null), '[null]'],
				[Symbol(''), getInferredName ? '[]' : ''],
				[Symbol.iterator, '[Symbol.iterator]'],
				[Symbol('foo'), '[foo]']
			];
			forEach(pairs, function (pair) {
				var sym = pair[0];
				var desc = pair[1];
				var f = getNamelessFunction();
				ES.SetFunctionName(f, sym);
				st.equal(f.name, desc, debug(sym) + ' yields a name of ' + debug(desc));
			});

			st.end();
		});

		var f = getNamelessFunction();
		t.test('when names are configurable', { skip: !functionsHaveConfigurableNames || has(f, 'name') }, function (st) {
			// without prefix
			st.notEqual(f.name, 'foo', 'precondition');
			ES.SetFunctionName(f, 'foo');
			st.equal(f.name, 'foo', 'function name is set without a prefix');

			// with prefix
			var g = getNamelessFunction();
			st.notEqual(g.name, 'pre- foo', 'precondition');
			ES.SetFunctionName(g, 'foo', 'pre-');
			st.equal(g.name, 'pre- foo', 'function name is set with a prefix');

			st.end();
		});

		t.end();
	});

	test('SetIntegrityLevel', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.SetIntegrityLevel(primitive); },
				TypeError,
				debug(primitive) + ' is not an Object'
			);
		});

		t['throws'](
			function () { ES.SetIntegrityLevel({}); },
			/^TypeError: Assertion failed: `level` must be `"sealed"` or `"frozen"`$/,
			'`level` must be `"sealed"` or `"frozen"`'
		);

		var O = { a: 1 };
		t.test('sealed', { skip: !Object.preventExtensions || noThrowOnStrictViolation }, function (st) {
			st.equal(ES.SetIntegrityLevel(O, 'sealed'), true);
			st['throws'](
				function () { O.b = 2; },
				/^TypeError: (Cannot|Can't) add property b, object is not extensible$/,
				'sealing prevent new properties from being added'
			);
			O.a = 2;
			st.equal(O.a, 2, 'pre-frozen, existing properties are mutable');
			st.end();
		});

		t.test('frozen', { skip: !Object.freeze || noThrowOnStrictViolation }, function (st) {
			st.equal(ES.SetIntegrityLevel(O, 'frozen'), true);
			st['throws'](
				function () { O.a = 3; },
				/^TypeError: Cannot assign to read only property 'a' of /,
				'freezing prevents existing properties from being mutated'
			);
			st.end();
		});

		t.end();
	});

	test('SpeciesConstructor', function (t) {
		t['throws'](function () { ES.SpeciesConstructor(null); }, TypeError);
		t['throws'](function () { ES.SpeciesConstructor(undefined); }, TypeError);

		var defaultConstructor = function Foo() {};

		t.equal(
			ES.SpeciesConstructor({ constructor: undefined }, defaultConstructor),
			defaultConstructor,
			'undefined constructor returns defaultConstructor'
		);

		t['throws'](
			function () { return ES.SpeciesConstructor({ constructor: null }, defaultConstructor); },
			TypeError,
			'non-undefined non-object constructor throws'
		);

		t.test('with Symbol.species', { skip: !hasSpecies }, function (st) {
			var Bar = function Bar() {};
			Bar[Symbol.species] = null;

			st.equal(
				ES.SpeciesConstructor(new Bar(), defaultConstructor),
				defaultConstructor,
				'undefined/null Symbol.species returns default constructor'
			);

			var Baz = function Baz() {};
			Baz[Symbol.species] = Bar;
			st.equal(
				ES.SpeciesConstructor(new Baz(), defaultConstructor),
				Bar,
				'returns Symbol.species constructor value'
			);

			Baz[Symbol.species] = {};
			st['throws'](
				function () { ES.SpeciesConstructor(new Baz(), defaultConstructor); },
				TypeError,
				'throws when non-constructor non-null non-undefined species value found'
			);

			st.end();
		});

		t.end();
	});

	test('SplitMatch', function (t) {
		forEach(v.nonStrings, function (nonString) {
			t['throws'](
				function () { ES.SplitMatch(nonString, 0, ''); },
				TypeError,
				'S: ' + debug(nonString) + ' is not a String'
			);
			t['throws'](
				function () { ES.SplitMatch('', 0, nonString); },
				TypeError,
				'R: ' + debug(nonString) + ' is not a String'
			);
		});

		forEach(v.nonNumbers.concat(v.nonIntegerNumbers), function (nonIntegerNumber) {
			t['throws'](
				function () { ES.SplitMatch('', nonIntegerNumber, ''); },
				TypeError,
				'q: ' + debug(nonIntegerNumber) + ' is not an integer'
			);
		});

		t.equal(ES.SplitMatch('abc', 0, 'a'), 1, '"a" is found at index 0, before index 1, in "abc"');
		t.equal(ES.SplitMatch('abc', 1, 'a'), false, '"a" is not found at index 1 in "abc"');
		t.equal(ES.SplitMatch('abc', 2, 'a'), false, '"a" is not found at index 2 in "abc"');

		t.equal(ES.SplitMatch('abc', 0, 'b'), false, '"a" is not found at index 0 in "abc"');
		t.equal(ES.SplitMatch('abc', 1, 'b'), 2, '"b" is found at index 1, before index 2, in "abc"');
		t.equal(ES.SplitMatch('abc', 2, 'b'), false, '"a" is not found at index 2 in "abc"');

		t.equal(ES.SplitMatch('abc', 0, 'c'), false, '"a" is not found at index 0 in "abc"');
		t.equal(ES.SplitMatch('abc', 1, 'c'), false, '"a" is not found at index 1 in "abc"');
		t.equal(ES.SplitMatch('abc', 2, 'c'), 3, '"c" is found at index 2, before index 3, in "abc"');

		t.equal(ES.SplitMatch('a', 0, 'ab'), false, 'R longer than S yields false');

		var s = 'a' + wholePoo + 'c';
		t.equal(ES.SplitMatch(s, 1, wholePoo), 3, debug(wholePoo) + ' is found at index 1, before index 3, in ' + debug(s));

		t.end();
	});

	test('StringCreate', function (t) {
		forEach(v.nonStrings, function (nonString) {
			t['throws'](
				function () { ES.StringCreate(nonString); },
				TypeError,
				debug(nonString) + ' is not a String'
			);
		});

		t.deepEqual(ES.StringCreate('foo', String.prototype), Object('foo'), '"foo" with `String.prototype` makes `Object("foo")');

		if ($setProto) {
			var proto = {};
			t.equal($getProto(ES.StringCreate('', proto)), proto, '[[Prototype]] is set as expected');
		} else {
			t['throws'](
				function () { ES.StringCreate('', proto); },
				SyntaxError,
				'setting [[Prototype]] is not supported in this env'
			);
		}

		t.equal(ES.StringCreate('a', String.prototype).length, 'a'.length, 'length is preserved');

		t.end();
	});

	test('StringGetIndexProperty', function (t) {
		forEach(v.nonStrings.concat(v.strings), function (nonStringObjects) {
			t['throws'](
				function () { ES.StringGetIndexProperty(nonStringObjects); },
				TypeError,
				debug(nonStringObjects) + ' is not a boxed String Object'
			);
		});

		forEach(v.nonPropertyKeys, function (nonPropertyKey) {
			t['throws'](
				function () { ES.StringGetIndexProperty('', nonPropertyKey); },
				TypeError,
				debug(nonPropertyKey) + ' is not a Property Key'
			);
		});

		forEach(v.symbols, function (symbol) {
			t.equal(
				ES.StringGetIndexProperty(Object('a'), symbol),
				undefined,
				debug(symbol) + ' is a Property Key, but not a String'
			);
		});

		// a string where CanonicalNumericIndexString returns undefined, a non-integer, or -0
		forEach(['-1', '-0', 'undefined'].concat(v.nonIntegerNumbers), function (nonIndex) {
			var S = Object('abc');
			t.equal(
				ES.StringGetIndexProperty(S, String(nonIndex)),
				undefined,
				debug(nonIndex) + ' is not an index inside ' + debug(S)
			);
		});

		forEach(v.strings, function (str) {
			var S = Object(str);
			for (var i = 0; i < str.length; i += 1) {
				var desc = {
					'[[Configurable]]': false,
					'[[Enumerable]]': true,
					'[[Value]]': str.charAt(i),
					'[[Writable]]': false
				};
				t.deepEqual(
					ES.StringGetIndexProperty(S, String(i)),
					desc,
					'boxed String ' + debug(S) + ' at index ' + debug(i) + ' is ' + debug(desc)
				);
			}
			t.equal(
				ES.StringGetIndexProperty(S, String(str.length)),
				undefined,
				'boxed String ' + debug(S) + ' at OOB index ' + debug(str.length) + ' is `undefined'
			);
		});

		t.end();
	});

	test('SymbolDescriptiveString', function (t) {
		forEach(v.nonSymbolPrimitives.concat(v.objects), function (nonSymbol) {
			t['throws'](
				function () { ES.SymbolDescriptiveString(nonSymbol); },
				TypeError,
				debug(nonSymbol) + ' is not a Symbol'
			);
		});

		t.test('Symbols', { skip: !v.hasSymbols }, function (st) {
			st.equal(ES.SymbolDescriptiveString(Symbol()), 'Symbol()', 'undefined description');
			st.equal(ES.SymbolDescriptiveString(Symbol('')), 'Symbol()', 'empty string description');
			st.equal(ES.SymbolDescriptiveString(Symbol.iterator), 'Symbol(Symbol.iterator)', 'well-known symbol');
			st.equal(ES.SymbolDescriptiveString(Symbol('foo')), 'Symbol(foo)', 'string description');

			st.end();
		});

		t.end();
	});

	test('TestIntegrityLevel', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.TestIntegrityLevel(primitive); },
				TypeError,
				debug(primitive) + ' is not an Object'
			);
		});

		t['throws'](
			function () { ES.TestIntegrityLevel({ a: 1 }); },
			/^TypeError: Assertion failed: `level` must be `"sealed"` or `"frozen"`$/,
			'`level` must be `"sealed"` or `"frozen"`'
		);

		t.equal(ES.TestIntegrityLevel({ a: 1 }, 'sealed'), false, 'basic object is not sealed');
		t.equal(ES.TestIntegrityLevel({ a: 1 }, 'frozen'), false, 'basic object is not frozen');

		t.test('preventExtensions', { skip: !Object.preventExtensions }, function (st) {
			var o = Object.preventExtensions({ a: 1 });
			st.equal(ES.TestIntegrityLevel(o, 'sealed'), false, 'nonextensible object is not sealed');
			st.equal(ES.TestIntegrityLevel(o, 'frozen'), false, 'nonextensible object is not frozen');

			var empty = Object.preventExtensions({});
			st.equal(ES.TestIntegrityLevel(empty, 'sealed'), true, 'empty nonextensible object is sealed');
			st.equal(ES.TestIntegrityLevel(empty, 'frozen'), true, 'empty nonextensible object is frozen');
			st.end();
		});

		t.test('seal', { skip: !Object.seal }, function (st) {
			var o = Object.seal({ a: 1 });
			st.equal(ES.TestIntegrityLevel(o, 'sealed'), true, 'sealed object is sealed');
			st.equal(ES.TestIntegrityLevel(o, 'frozen'), false, 'sealed object is not frozen');

			var empty = Object.seal({});
			st.equal(ES.TestIntegrityLevel(empty, 'sealed'), true, 'empty sealed object is sealed');
			st.equal(ES.TestIntegrityLevel(empty, 'frozen'), true, 'empty sealed object is frozen');

			st.end();
		});

		t.test('freeze', { skip: !Object.freeze }, function (st) {
			var o = Object.freeze({ a: 1 });
			st.equal(ES.TestIntegrityLevel(o, 'sealed'), true, 'frozen object is sealed');
			st.equal(ES.TestIntegrityLevel(o, 'frozen'), true, 'frozen object is frozen');

			var empty = Object.freeze({});
			st.equal(ES.TestIntegrityLevel(empty, 'sealed'), true, 'empty frozen object is sealed');
			st.equal(ES.TestIntegrityLevel(empty, 'frozen'), true, 'empty frozen object is frozen');

			st.end();
		});

		t.end();
	});

	test('thisNumberValue', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.thisNumberValue(nonNumber); },
				TypeError,
				debug(nonNumber) + ' is not a Number'
			);
		});

		forEach(v.numbers, function (number) {
			t.equal(ES.thisNumberValue(number), number, debug(number) + ' is its own thisNumberValue');
			var obj = Object(number);
			t.equal(ES.thisNumberValue(obj), number, debug(obj) + ' is the boxed thisNumberValue');
		});

		t.end();
	});

	test('thisBooleanValue', function (t) {
		forEach(v.nonBooleans, function (nonBoolean) {
			t['throws'](
				function () { ES.thisBooleanValue(nonBoolean); },
				TypeError,
				debug(nonBoolean) + ' is not a Boolean'
			);
		});

		forEach(v.booleans, function (boolean) {
			t.equal(ES.thisBooleanValue(boolean), boolean, debug(boolean) + ' is its own thisBooleanValue');
			var obj = Object(boolean);
			t.equal(ES.thisBooleanValue(obj), boolean, debug(obj) + ' is the boxed thisBooleanValue');
		});

		t.end();
	});

	test('thisStringValue', function (t) {
		forEach(v.nonStrings, function (nonString) {
			t['throws'](
				function () { ES.thisStringValue(nonString); },
				TypeError,
				debug(nonString) + ' is not a String'
			);
		});

		forEach(v.strings, function (string) {
			t.equal(ES.thisStringValue(string), string, debug(string) + ' is its own thisStringValue');
			var obj = Object(string);
			t.equal(ES.thisStringValue(obj), string, debug(obj) + ' is the boxed thisStringValue');
		});

		t.end();
	});

	test('thisTimeValue', function (t) {
		forEach(v.primitives.concat(v.objects), function (nonDate) {
			t['throws'](
				function () { ES.thisTimeValue(nonDate); },
				TypeError,
				debug(nonDate) + ' is not a Date'
			);
		});

		forEach(v.timestamps, function (timestamp) {
			var date = new Date(timestamp);

			t.equal(ES.thisTimeValue(date), timestamp, debug(date) + ' is its own thisTimeValue');
		});

		t.end();
	});

	test('ToDateString', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.ToDateString(nonNumber); },
				TypeError,
				debug(nonNumber) + ' is not a Number'
			);
		});

		t.equal(ES.ToDateString(NaN), 'Invalid Date', 'NaN becomes "Invalid Date"');
		var now = +new Date();
		t.equal(ES.ToDateString(now), Date(now), 'any timestamp becomes `Date(timestamp)`');
		t.end();
	});

	test('ToInt16', function (t) {
		t.equal(0, ES.ToInt16(NaN), 'NaN coerces to +0');
		forEach([0, Infinity], function (num) {
			t.equal(0, ES.ToInt16(num), num + ' returns +0');
			t.equal(0, ES.ToInt16(-num), '-' + num + ' returns +0');
		});
		t['throws'](function () { return ES.ToInt16(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws');
		t.equal(ES.ToInt16(0x100000000), 0, '2^32 returns +0');
		t.equal(ES.ToInt16(0x100000000 - 1), -1, '2^32 - 1 returns -1');
		t.equal(ES.ToInt16(0x80000000), 0, '2^31 returns +0');
		t.equal(ES.ToInt16(0x80000000 - 1), -1, '2^31 - 1 returns -1');
		t.equal(ES.ToInt16(0x10000), 0, '2^16 returns +0');
		t.equal(ES.ToInt16(0x10000 - 1), -1, '2^16 - 1 returns -1');
		t.end();
	});

	test('ToInt8', function (t) {
		t.equal(0, ES.ToInt8(NaN), 'NaN coerces to +0');
		forEach([0, Infinity], function (num) {
			t.equal(0, ES.ToInt8(num), num + ' returns +0');
			t.equal(0, ES.ToInt8(-num), '-' + num + ' returns +0');
		});
		t['throws'](function () { return ES.ToInt8(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws');
		t.equal(ES.ToInt8(0x100000000), 0, '2^32 returns +0');
		t.equal(ES.ToInt8(0x100000000 - 1), -1, '2^32 - 1 returns -1');
		t.equal(ES.ToInt8(0x80000000), 0, '2^31 returns +0');
		t.equal(ES.ToInt8(0x80000000 - 1), -1, '2^31 - 1 returns -1');
		t.equal(ES.ToInt8(0x10000), 0, '2^16 returns +0');
		t.equal(ES.ToInt8(0x10000 - 1), -1, '2^16 - 1 returns -1');
		t.equal(ES.ToInt8(0x100), 0, '2^8 returns +0');
		t.equal(ES.ToInt8(0x100 - 1), -1, '2^8 - 1 returns -1');
		t.equal(ES.ToInt8(0x10), 0x10, '2^4 returns 2^4');
		t.end();
	});

	test('ToNumber', function (t) {
		testToNumber(t, ES, ES.ToNumber);

		t.end();
	});

	test('ToUint8', function (t) {
		t.equal(0, ES.ToUint8(NaN), 'NaN coerces to +0');
		forEach([0, Infinity], function (num) {
			t.equal(0, ES.ToUint8(num), num + ' returns +0');
			t.equal(0, ES.ToUint8(-num), '-' + num + ' returns +0');
		});
		t['throws'](function () { return ES.ToUint8(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws');
		t.equal(ES.ToUint8(0x100000000), 0, '2^32 returns +0');
		t.equal(ES.ToUint8(0x100000000 - 1), 0x100 - 1, '2^32 - 1 returns 2^8 - 1');
		t.equal(ES.ToUint8(0x80000000), 0, '2^31 returns +0');
		t.equal(ES.ToUint8(0x80000000 - 1), 0x100 - 1, '2^31 - 1 returns 2^8 - 1');
		t.equal(ES.ToUint8(0x10000), 0, '2^16 returns +0');
		t.equal(ES.ToUint8(0x10000 - 1), 0x100 - 1, '2^16 - 1 returns 2^8 - 1');
		t.equal(ES.ToUint8(0x100), 0, '2^8 returns +0');
		t.equal(ES.ToUint8(0x100 - 1), 0x100 - 1, '2^8 - 1 returns 2^16 - 1');
		t.equal(ES.ToUint8(0x10), 0x10, '2^4 returns 2^4');
		t.equal(ES.ToUint8(0x10 - 1), 0x10 - 1, '2^4 - 1 returns 2^4 - 1');
		t.end();
	});

	test('ToUint8Clamp', function (t) {
		t.equal(0, ES.ToUint8Clamp(NaN), 'NaN coerces to +0');
		t.equal(0, ES.ToUint8Clamp(0), '+0 returns +0');
		t.equal(0, ES.ToUint8Clamp(-0), '-0 returns +0');
		t.equal(0, ES.ToUint8Clamp(-Infinity), '-Infinity returns +0');
		t['throws'](function () { return ES.ToUint8Clamp(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws');
		forEach([255, 256, 0x100000, Infinity], function (number) {
			t.equal(255, ES.ToUint8Clamp(number), number + ' coerces to 255');
		});
		t.equal(1, ES.ToUint8Clamp(1.49), '1.49 coerces to 1');
		t.equal(2, ES.ToUint8Clamp(1.5), '1.5 coerces to 2, because 2 is even');
		t.equal(2, ES.ToUint8Clamp(1.51), '1.51 coerces to 2');

		t.equal(2, ES.ToUint8Clamp(2.49), '2.49 coerces to 2');
		t.equal(2, ES.ToUint8Clamp(2.5), '2.5 coerces to 2, because 2 is even');
		t.equal(3, ES.ToUint8Clamp(2.51), '2.51 coerces to 3');
		t.end();
	});

	test('ToLength', function (t) {
		t['throws'](function () { return ES.ToLength(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws a TypeError');
		t.equal(3, ES.ToLength(v.coercibleObject), 'coercibleObject coerces to 3');
		t.equal(42, ES.ToLength('42.5'), '"42.5" coerces to 42');
		t.equal(7, ES.ToLength(7.3), '7.3 coerces to 7');
		forEach([-0, -1, -42, -Infinity], function (negative) {
			t.equal(0, ES.ToLength(negative), negative + ' coerces to +0');
		});
		t.equal(MAX_SAFE_INTEGER, ES.ToLength(MAX_SAFE_INTEGER + 1), '2^53 coerces to 2^53 - 1');
		t.equal(MAX_SAFE_INTEGER, ES.ToLength(MAX_SAFE_INTEGER + 3), '2^53 + 2 coerces to 2^53 - 1');
		t.end();
	});

	test('ToPropertyKey', function (t) {
		forEach(v.objects.concat(v.nonSymbolPrimitives), function (value) {
			t.equal(ES.ToPropertyKey(value), String(value), 'ToPropertyKey(value) === String(value) for non-Symbols');
		});

		forEach(v.symbols, function (symbol) {
			t.equal(
				ES.ToPropertyKey(symbol),
				symbol,
				'ToPropertyKey(' + debug(symbol) + ') === ' + debug(symbol)
			);
			t.equal(
				ES.ToPropertyKey(Object(symbol)),
				symbol,
				'ToPropertyKey(' + debug(Object(symbol)) + ') === ' + debug(symbol)
			);
		});

		t.end();
	});

	test('ToString', function (t) {
		forEach(v.objects.concat(v.nonSymbolPrimitives), function (item) {
			t.equal(ES.ToString(item), String(item), 'ES.ToString(' + debug(item) + ') ToStrings to String(' + debug(item) + ')');
		});

		t['throws'](function () { return ES.ToString(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws');

		forEach(v.symbols, function (symbol) {
			t['throws'](function () { return ES.ToString(symbol); }, TypeError, debug(symbol) + ' throws');
		});
		t.end();
	});

	test('Type', function (t) {
		t.equal(ES.Type(), 'Undefined', 'Type() is Undefined');
		t.equal(ES.Type(undefined), 'Undefined', 'Type(undefined) is Undefined');
		t.equal(ES.Type(null), 'Null', 'Type(null) is Null');
		t.equal(ES.Type(true), 'Boolean', 'Type(true) is Boolean');
		t.equal(ES.Type(false), 'Boolean', 'Type(false) is Boolean');
		t.equal(ES.Type(0), 'Number', 'Type(0) is Number');
		t.equal(ES.Type(NaN), 'Number', 'Type(NaN) is Number');
		t.equal(ES.Type('abc'), 'String', 'Type("abc") is String');
		t.equal(ES.Type(function () {}), 'Object', 'Type(function () {}) is Object');
		t.equal(ES.Type({}), 'Object', 'Type({}) is Object');

		t.test('symbols', { skip: !v.hasSymbols }, function (st) {
			st.equal(ES.Type(Symbol.iterator), 'Symbol', 'Type(Symbol.iterator) is Symbol');
			st.end();
		});

		t.end();
	});

	test('ValidateAndApplyPropertyDescriptor', function (t) {
		forEach(v.nonUndefinedPrimitives, function (nonUndefinedPrimitive) {
			t['throws'](
				function () { ES.ValidateAndApplyPropertyDescriptor(nonUndefinedPrimitive, '', false, v.genericDescriptor(), v.genericDescriptor()); },
				TypeError,
				'O: ' + debug(nonUndefinedPrimitive) + ' is not undefined or an Object'
			);
		});

		forEach(v.nonBooleans, function (nonBoolean) {
			t['throws'](
				function () {
					return ES.ValidateAndApplyPropertyDescriptor(
						undefined,
						null,
						nonBoolean,
						v.genericDescriptor(),
						v.genericDescriptor()
					);
				},
				TypeError,
				'extensible: ' + debug(nonBoolean) + ' is not a Boolean'
			);
		});

		forEach(v.primitives, function (primitive) {
			// Desc must be a Property Descriptor
			t['throws'](
				function () {
					return ES.ValidateAndApplyPropertyDescriptor(
						undefined,
						null,
						false,
						primitive,
						v.genericDescriptor()
					);
				},
				TypeError,
				'Desc: ' + debug(primitive) + ' is not a Property Descriptor'
			);
		});

		forEach(v.nonUndefinedPrimitives, function (primitive) {
			// current must be undefined or a Property Descriptor
			t['throws'](
				function () {
					return ES.ValidateAndApplyPropertyDescriptor(
						undefined,
						null,
						false,
						v.genericDescriptor(),
						primitive
					);
				},
				TypeError,
				'current: ' + debug(primitive) + ' is not a Property Descriptor or undefined'
			);
		});

		forEach(v.nonPropertyKeys, function (nonPropertyKey) {
			// if O is an object, P must be a property key
			t['throws'](
				function () {
					return ES.ValidateAndApplyPropertyDescriptor(
						{},
						nonPropertyKey,
						false,
						v.genericDescriptor(),
						v.genericDescriptor()
					);
				},
				TypeError,
				'P: ' + debug(nonPropertyKey) + ' is not a Property Key'
			);
		});

		t.test('current is undefined', function (st) {
			var propertyKey = 'howdy';

			st.test('generic descriptor', function (s2t) {
				var generic = v.genericDescriptor();
				generic['[[Enumerable]]'] = true;
				var O = {};
				ES.ValidateAndApplyPropertyDescriptor(undefined, propertyKey, true, generic);
				s2t.equal(
					ES.ValidateAndApplyPropertyDescriptor(O, propertyKey, false, generic),
					false,
					'when extensible is false, nothing happens'
				);
				s2t.deepEqual(O, {}, 'no changes applied when O is undefined or extensible is false');
				s2t.equal(
					ES.ValidateAndApplyPropertyDescriptor(O, propertyKey, true, generic),
					true,
					'operation is successful'
				);
				var expected = {};
				expected[propertyKey] = undefined;
				s2t.deepEqual(O, expected, 'generic descriptor has been defined as an own data property');
				s2t.end();
			});

			st.test('data descriptor', function (s2t) {
				var data = v.dataDescriptor();
				data['[[Enumerable]]'] = true;

				var O = {};
				s2t.equal(
					ES.ValidateAndApplyPropertyDescriptor(undefined, propertyKey, true, data),
					true,
					'noop when O is undefined'
				);
				s2t.equal(
					ES.ValidateAndApplyPropertyDescriptor(O, propertyKey, false, data),
					false,
					'when extensible is false, nothing happens'
				);
				s2t.deepEqual(O, {}, 'no changes applied when O is undefined or extensible is false');
				s2t.equal(
					ES.ValidateAndApplyPropertyDescriptor(O, propertyKey, true, data),
					true,
					'operation is successful'
				);
				var expected = {};
				expected[propertyKey] = data['[[Value]]'];
				s2t.deepEqual(O, expected, 'data descriptor has been defined as an own data property');
				s2t.end();
			});

			st.test('accessor descriptor', { skip: !defineProperty.oDP }, function (s2t) {
				var count = 0;
				var accessor = v.accessorDescriptor();
				accessor['[[Enumerable]]'] = true;
				accessor['[[Get]]'] = function () {
					count += 1;
					return count;
				};

				var O = {};
				ES.ValidateAndApplyPropertyDescriptor(undefined, propertyKey, true, accessor);
				s2t.equal(
					ES.ValidateAndApplyPropertyDescriptor(O, propertyKey, false, accessor),
					false,
					'when extensible is false, nothing happens'
				);
				s2t.deepEqual(O, {}, 'no changes applied when O is undefined or extensible is false');
				s2t.equal(
					ES.ValidateAndApplyPropertyDescriptor(O, propertyKey, true, accessor),
					true,
					'operation is successful'
				);
				var expected = {};
				expected[propertyKey] = accessor['[[Get]]']() + 1;
				s2t.deepEqual(O, expected, 'accessor descriptor has been defined as an own accessor property');
				s2t.end();
			});

			st.end();
		});

		t.test('every field in Desc is absent', { skip: 'it is unclear if having no fields qualifies Desc to be a Property Descriptor' });

		forEach([v.dataDescriptor, v.accessorDescriptor, v.mutatorDescriptor], function (getDescriptor) {
			t.equal(
				ES.ValidateAndApplyPropertyDescriptor(undefined, 'property key', true, getDescriptor(), getDescriptor()),
				true,
				'when Desc and current are the same, early return true'
			);
		});

		t.test('current is nonconfigurable', function (st) {
			// note: these must not be generic descriptors, or else the algorithm returns an early true
			st.equal(
				ES.ValidateAndApplyPropertyDescriptor(
					undefined,
					'property key',
					true,
					v.descriptors.configurable(v.dataDescriptor()),
					v.descriptors.nonConfigurable(v.dataDescriptor())
				),
				false,
				'false if Desc is configurable'
			);

			st.equal(
				ES.ValidateAndApplyPropertyDescriptor(
					undefined,
					'property key',
					true,
					v.descriptors.enumerable(v.dataDescriptor()),
					v.descriptors.nonEnumerable(v.dataDescriptor())
				),
				false,
				'false if Desc is Enumerable and current is not'
			);

			st.equal(
				ES.ValidateAndApplyPropertyDescriptor(
					undefined,
					'property key',
					true,
					v.descriptors.nonEnumerable(v.dataDescriptor()),
					v.descriptors.enumerable(v.dataDescriptor())
				),
				false,
				'false if Desc is not Enumerable and current is'
			);

			var descLackingEnumerable = v.accessorDescriptor();
			delete descLackingEnumerable['[[Enumerable]]'];
			st.equal(
				ES.ValidateAndApplyPropertyDescriptor(
					undefined,
					'property key',
					true,
					descLackingEnumerable,
					v.descriptors.enumerable(v.accessorDescriptor())
				),
				true,
				'not false if Desc lacks Enumerable'
			);

			st.end();
		});

		t.test('Desc and current: one is a data descriptor, one is not', { skip: !defineProperty || !getOwnPropertyDescriptor }, function (st) {
			// note: Desc must be configurable if current is nonconfigurable, to hit this branch
			st.equal(
				ES.ValidateAndApplyPropertyDescriptor(
					undefined,
					'property key',
					true,
					v.descriptors.configurable(v.accessorDescriptor()),
					v.descriptors.nonConfigurable(v.dataDescriptor())
				),
				false,
				'false if current (data) is nonconfigurable'
			);

			st.equal(
				ES.ValidateAndApplyPropertyDescriptor(
					undefined,
					'property key',
					true,
					v.descriptors.configurable(v.dataDescriptor()),
					v.descriptors.nonConfigurable(v.accessorDescriptor())
				),
				false,
				'false if current (not data) is nonconfigurable'
			);

			// one is data and one is not,
			//	// if current is data, convert to accessor
			//	// else convert to data

			var startsWithData = {
				'property key': 42
			};
			st.equal(
				ES.ValidateAndApplyPropertyDescriptor(
					startsWithData,
					'property key',
					true,
					v.descriptors.enumerable(v.descriptors.configurable(v.accessorDescriptor())),
					v.descriptors.enumerable(v.descriptors.configurable(v.dataDescriptor()))
				),
				true,
				'operation is successful: current is data, Desc is accessor'
			);
			var shouldBeAccessor = getOwnPropertyDescriptor(startsWithData, 'property key');
			st.equal(typeof shouldBeAccessor.get, 'function', 'has a getter');

			var key = 'property key';
			var startsWithAccessor = {};
			defineProperty(startsWithAccessor, key, {
				configurable: true,
				enumerable: true,
				get: function get() { return 42; }
			});
			st.equal(
				ES.ValidateAndApplyPropertyDescriptor(
					startsWithAccessor,
					key,
					true,
					v.descriptors.enumerable(v.descriptors.configurable(v.dataDescriptor())),
					v.descriptors.enumerable(v.descriptors.configurable(v.accessorDescriptor(42)))
				),
				true,
				'operation is successful: current is accessor, Desc is data'
			);
			var shouldBeData = getOwnPropertyDescriptor(startsWithAccessor, 'property key');
			st.deepEqual(shouldBeData, { configurable: true, enumerable: true, value: 42, writable: false }, 'is a data property');

			st.end();
		});

		t.test('Desc and current are both data descriptors', function (st) {
			st.equal(
				ES.ValidateAndApplyPropertyDescriptor(
					undefined,
					'property key',
					true,
					v.descriptors.writable(v.dataDescriptor()),
					v.descriptors.nonWritable(v.descriptors.nonConfigurable(v.dataDescriptor()))
				),
				false,
				'false if frozen current and writable Desc'
			);

			st.equal(
				ES.ValidateAndApplyPropertyDescriptor(
					undefined,
					'property key',
					true,
					v.descriptors.configurable({ '[[Value]]': 42 }),
					v.descriptors.nonWritable({ '[[Value]]': 7 })
				),
				false,
				'false if nonwritable current has a different value than Desc'
			);

			st.end();
		});

		t.test('current is nonconfigurable; Desc and current are both accessor descriptors', function (st) {
			st.equal(
				ES.ValidateAndApplyPropertyDescriptor(
					undefined,
					'property key',
					true,
					v.mutatorDescriptor(),
					v.descriptors.nonConfigurable(v.mutatorDescriptor())
				),
				false,
				'false if both Sets are not equal'
			);

			st.equal(
				ES.ValidateAndApplyPropertyDescriptor(
					undefined,
					'property key',
					true,
					v.accessorDescriptor(),
					v.descriptors.nonConfigurable(v.accessorDescriptor())
				),
				false,
				'false if both Gets are not equal'
			);

			st.end();
		});

		t.end();
	});
};

var es2016 = function ES2016(ES, ops, expectedMissing, skips) {
	es2015(ES, ops, expectedMissing, assign(assign({}, skips), {
		StringGetIndexProperty: true
	}));
	var test = makeTest(skips);

	test('IterableToArrayLike', function (t) {
		t.test('custom iterables', { skip: !v.hasSymbols }, function (st) {
			var O = {};
			O[Symbol.iterator] = function () {
				var i = -1;
				return {
					next: function () {
						i += 1;
						return {
							done: i >= 5,
							value: i
						};
					}
				};
			};
			st.deepEqual(
				ES.IterableToArrayLike(O),
				[0, 1, 2, 3, 4],
				'Symbol.iterator method is called and values collected'
			);

			st.end();
		});

		t.deepEqual(ES.IterableToArrayLike('abc'), ['a', 'b', 'c'], 'a string of code units spreads');
		t.deepEqual(ES.IterableToArrayLike('💩'), ['💩'], 'a string of code points spreads');
		t.deepEqual(ES.IterableToArrayLike('a💩c'), ['a', '💩', 'c'], 'a string of code points and units spreads');

		var arr = [1, 2, 3];
		t.deepEqual(ES.IterableToArrayLike(arr), arr, 'an array becomes a similar array');
		t.notEqual(ES.IterableToArrayLike(arr), arr, 'an array becomes a different, but similar, array');

		var O = {};
		t.equal(ES.IterableToArrayLike(O), O, 'a non-iterable non-array non-string object is returned directly');

		t.end();
	});

	test('OrdinaryGetPrototypeOf', function (t) {
		t.test('values', { skip: !$getProto }, function (st) {
			st.equal(ES.OrdinaryGetPrototypeOf([]), Array.prototype, 'array [[Prototype]] is Array.prototype');
			st.equal(ES.OrdinaryGetPrototypeOf({}), Object.prototype, 'object [[Prototype]] is Object.prototype');
			st.equal(ES.OrdinaryGetPrototypeOf(/a/g), RegExp.prototype, 'regex [[Prototype]] is RegExp.prototype');
			st.equal(ES.OrdinaryGetPrototypeOf(Object('')), String.prototype, 'boxed string [[Prototype]] is String.prototype');
			st.equal(ES.OrdinaryGetPrototypeOf(Object(42)), Number.prototype, 'boxed number [[Prototype]] is Number.prototype');
			st.equal(ES.OrdinaryGetPrototypeOf(Object(true)), Boolean.prototype, 'boxed boolean [[Prototype]] is Boolean.prototype');
			if (v.hasSymbols) {
				st.equal(ES.OrdinaryGetPrototypeOf(Object(Symbol.iterator)), Symbol.prototype, 'boxed symbol [[Prototype]] is Symbol.prototype');
			}
			st.end();
		});

		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.OrdinaryGetPrototypeOf(primitive); },
				TypeError,
				debug(primitive) + ' is not an Object'
			);
		});
		t.end();
	});

	test('OrdinarySetPrototypeOf', { skip: !$getProto || !$setProto }, function (t) {
		var a = [];
		var proto = {};

		t.equal(ES.OrdinaryGetPrototypeOf(a), Array.prototype, 'precondition');
		t.equal(ES.OrdinarySetPrototypeOf(a, proto), true, 'setting prototype is successful');
		t.equal(ES.OrdinaryGetPrototypeOf(a), proto, 'postcondition');

		t.end();
	});

	test('SameValueNonNumber', function (t) {
		var willThrow = [
			[3, 4],
			[NaN, 4],
			[4, ''],
			['abc', true],
			[{}, false]
		];
		forEach(willThrow, function (nums) {
			t['throws'](function () { return ES.SameValueNonNumber.apply(ES, nums); }, TypeError, 'value must be same type and non-number');
		});

		forEach(v.objects.concat(v.nonNumberPrimitives), function (val) {
			t.equal(val === val, ES.SameValueNonNumber(val, val), debug(val) + ' is SameValueNonNumber to itself');
		});

		t.end();
	});

	test('UTF16Encoding', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.UTF16Encoding(nonNumber); },
				TypeError,
				debug(nonNumber) + ' is not a Number'
			);
		});

		t['throws'](
			function () { ES.UTF16Encoding(-1); },
			TypeError,
			'-1 is < 0'
		);

		t['throws'](
			function () { ES.UTF16Encoding(0x10FFFF + 1); },
			TypeError,
			'0x10FFFF + 1 is > 0x10FFFF'
		);

		t.equal(ES.UTF16Encoding(0xD83D), leadingPoo, '0xD83D is the first half of ' + wholePoo);
		t.equal(ES.UTF16Encoding(0xDCA9), trailingPoo, '0xDCA9 is the last half of ' + wholePoo);
		t.equal(ES.UTF16Encoding(0x1F4A9), wholePoo, '0xDCA9 is the last half of ' + wholePoo);

		t.end();
	});

	test('UTF16Decode', function (t) {
		t['throws'](
			function () { ES.UTF16Decode('a'.charCodeAt(0), trailingPoo.charCodeAt(0)); },
			TypeError,
			'"a" is not a leading surrogate'
		);
		t['throws'](
			function () { ES.UTF16Decode(leadingPoo.charCodeAt(0), 'b'.charCodeAt(0)); },
			TypeError,
			'"b" is not a trailing surrogate'
		);

		t.equal(ES.UTF16Decode(leadingPoo.charCodeAt(0), trailingPoo.charCodeAt(0)), wholePoo);

		t.end();
	});
};

var es2017 = function ES2017(ES, ops, expectedMissing, skips) {
	es2016(ES, ops, expectedMissing, assign({}, skips, {
		EnumerableOwnNames: true,
		IterableToArrayLike: true
	}));
	var test = makeTest(skips);

	test('EnumerableOwnProperties', function (t) {
		var obj = testEnumerableOwnNames(t, function (O) {
			return ES.EnumerableOwnProperties(O, 'key');
		});

		t.deepEqual(
			ES.EnumerableOwnProperties(obj, 'value'),
			[obj.own],
			'returns enumerable own values'
		);

		t.deepEqual(
			ES.EnumerableOwnProperties(obj, 'key+value'),
			[['own', obj.own]],
			'returns enumerable own entries'
		);

		t.end();
	});

	test('IterableToList', function (t) {
		var customIterator = function () {
			var i = -1;
			return {
				next: function () {
					i += 1;
					return {
						done: i >= 5,
						value: i
					};
				}
			};
		};

		t.deepEqual(
			ES.IterableToList({}, customIterator),
			[0, 1, 2, 3, 4],
			'iterator method is called and values collected'
		);

		t.test('Symbol support', { skip: !v.hasSymbols }, function (st) {
			st.deepEqual(ES.IterableToList('abc', String.prototype[Symbol.iterator]), ['a', 'b', 'c'], 'a string of code units spreads');
			st.deepEqual(ES.IterableToList('☃', String.prototype[Symbol.iterator]), ['☃'], 'a string of code points spreads');

			var arr = [1, 2, 3];
			st.deepEqual(ES.IterableToList(arr, arr[Symbol.iterator]), arr, 'an array becomes a similar array');
			st.notEqual(ES.IterableToList(arr, arr[Symbol.iterator]), arr, 'an array becomes a different, but similar, array');

			st.end();
		});

		t['throws'](
			function () { ES.IterableToList({}, void 0); },
			TypeError,
			'non-function iterator method'
		);

		t.end();
	});

	test('StringGetOwnProperty', function (t) {
		forEach(v.nonStrings.concat(v.strings), function (nonBoxedString) {
			t['throws'](
				function () { ES.StringGetOwnProperty(nonBoxedString, '0'); },
				TypeError,
				debug(nonBoxedString) + ' is not a boxed String'
			);
		});
		forEach(v.nonPropertyKeys, function (nonPropertyKey) {
			t['throws'](
				function () { ES.StringGetOwnProperty(Object(''), nonPropertyKey); },
				TypeError,
				debug(nonPropertyKey) + ' is not a Property Key'
			);
		});

		t.equal(ES.StringGetOwnProperty(Object(''), '0'), undefined, 'empty boxed string yields undefined');

		forEach(v.strings, function (string) {
			if (string) {
				var S = Object(string);
				for (var i = 0; i < string.length; i += 1) {
					var descriptor = ES.StringGetOwnProperty(S, String(i));
					t.deepEqual(
						descriptor,
						{
							'[[Configurable]]': false,
							'[[Enumerable]]': true,
							'[[Value]]': string.charAt(i),
							'[[Writable]]': false
						},
						debug(string) + ': property ' + debug(String(i)) + ': returns expected descriptor'
					);
				}
			}
		});

		t.end();
	});

	test('ToIndex', function (t) {
		t.equal(ES.ToIndex(), 0, 'no value gives +0');
		t.equal(ES.ToIndex(undefined), 0, 'undefined value gives +0');
		t.equal(ES.ToIndex(-0), 0, '-0 gives +0');

		t['throws'](function () { ES.ToIndex(-1); }, RangeError, 'negative numbers throw');

		t['throws'](function () { ES.ToIndex(MAX_SAFE_INTEGER + 1); }, RangeError, 'too large numbers throw');

		t.equal(ES.ToIndex(3), 3, 'numbers work');
		t.equal(ES.ToIndex(v.valueOfOnlyObject), 4, 'coercible objects are coerced');

		t.end();
	});
};

var es2018 = function ES2018(ES, ops, expectedMissing, skips) {
	es2017(ES, ops, expectedMissing, assign({}, skips, {
		EnumerableOwnProperties: true,
		GetSubstitution: true,
		IsPropertyDescriptor: true
	}));
	var test = makeTest(skips);

	test('CopyDataProperties', function (t) {
		t.test('first argument: target', function (st) {
			forEach(v.primitives, function (primitive) {
				st['throws'](
					function () { ES.CopyDataProperties(primitive, {}, []); },
					TypeError,
					debug(primitive) + ' is not an Object'
				);
			});
			st.end();
		});

		t.test('second argument: source', function (st) {
			var frozenTarget = Object.freeze ? Object.freeze({}) : {};
			forEach(v.nullPrimitives, function (nullish) {
				st.equal(
					ES.CopyDataProperties(frozenTarget, nullish, []),
					frozenTarget,
					debug(nullish) + ' "source" yields identical, unmodified target'
				);
			});

			forEach(v.nonNullPrimitives, function (objectCoercible) {
				var target = {};
				var result = ES.CopyDataProperties(target, objectCoercible, []);
				st.equal(result, target, 'result === target');
				st.deepEqual(keys(result), keys(Object(objectCoercible)), 'target ends up with keys of ' + debug(objectCoercible));
			});

			st.test('enumerable accessor property', { skip: !defineProperty.oDP }, function (s2t) {
				var target = {};
				var source = {};
				defineProperty(source, 'a', {
					enumerable: true,
					get: function () { return 42; }
				});
				var result = ES.CopyDataProperties(target, source, []);
				s2t.equal(result, target, 'result === target');
				s2t.deepEqual(result, { a: 42 }, 'target ends up with enumerable accessor of source');
				s2t.end();
			});

			st.end();
		});

		t.test('third argument: excludedItems', function (st) {
			forEach(v.objects.concat(v.primitives), function (nonArray) {
				st['throws'](
					function () { ES.CopyDataProperties({}, {}, nonArray); },
					TypeError,
					debug(nonArray) + ' is not an Array'
				);
			});

			forEach(v.nonPropertyKeys, function (nonPropertyKey) {
				st['throws'](
					function () { ES.CopyDataProperties({}, {}, [nonPropertyKey]); },
					TypeError,
					debug(nonPropertyKey) + ' is not a Property Key'
				);
			});

			var result = ES.CopyDataProperties({}, { a: 1, b: 2, c: 3 }, ['b']);
			st.deepEqual(keys(result).sort(), ['a', 'c'].sort(), 'excluded string keys are excluded');

			st.test('excluding symbols', { skip: !v.hasSymbols }, function (s2t) {
				var source = {};
				forEach(v.symbols, function (symbol) {
					source[symbol] = true;
				});

				var includedSymbols = v.symbols.slice(1);
				var excludedSymbols = v.symbols.slice(0, 1);
				var target = ES.CopyDataProperties({}, source, excludedSymbols);

				forEach(includedSymbols, function (symbol) {
					s2t.equal(has(target, symbol), true, debug(symbol) + ' is included');
				});

				forEach(excludedSymbols, function (symbol) {
					s2t.equal(has(target, symbol), false, debug(symbol) + ' is excluded');
				});

				s2t.end();
			});

			st.end();
		});

		// TODO: CopyDataProperties does not throw when copying fails

		t.end();
	});

	test('DateString', function (t) {
		forEach(v.nonNumbers.concat(NaN), function (nonNumberOrNaN) {
			t['throws'](
				function () { ES.DateString(nonNumberOrNaN); },
				TypeError,
				debug(nonNumberOrNaN) + ' is not a non-NaN Number'
			);
		});

		t.equal(ES.DateString(Date.UTC(2019, 8, 10, 7, 8, 9)), 'Tue Sep 10 2019');
		t.equal(ES.DateString(Date.UTC(2016, 1, 29, 7, 8, 9)), 'Mon Feb 29 2016'); // leap day
		t.end();
	});

	test('EnumerableOwnPropertyNames', function (t) {
		var obj = testEnumerableOwnNames(t, function (O) {
			return ES.EnumerableOwnPropertyNames(O, 'key');
		});

		t.deepEqual(
			ES.EnumerableOwnPropertyNames(obj, 'value'),
			[obj.own],
			'returns enumerable own values'
		);

		t.deepEqual(
			ES.EnumerableOwnPropertyNames(obj, 'key+value'),
			[['own', obj.own]],
			'returns enumerable own entries'
		);

		t.end();
	});

	test('GetSubstitution', function (t) {
		forEach(v.nonStrings, function (nonString) {
			t['throws'](
				function () { ES.GetSubstitution(nonString, '', 0, [], undefined, ''); },
				TypeError,
				'`matched`: ' + debug(nonString) + ' is not a String'
			);

			t['throws'](
				function () { ES.GetSubstitution('', nonString, 0, [], undefined, ''); },
				TypeError,
				'`str`: ' + debug(nonString) + ' is not a String'
			);

			t['throws'](
				function () { ES.GetSubstitution('', '', 0, [], undefined, nonString); },
				TypeError,
				'`replacement`: ' + debug(nonString) + ' is not a String'
			);

			t['throws'](
				function () { ES.GetSubstitution('', '', 0, [nonString], undefined, ''); },
				TypeError,
				'`captures`: ' + debug([nonString]) + ' is not an Array of strings'
			);
		});

		forEach(v.notNonNegativeIntegers, function (nonNonNegativeInteger) {
			t['throws'](
				function () { ES.GetSubstitution('', '', nonNonNegativeInteger, [], undefined, ''); },
				TypeError,
				'`position`: ' + debug(nonNonNegativeInteger) + ' is not a non-negative integer'
			);
		});

		forEach(v.nonArrays, function (nonArray) {
			t['throws'](
				function () { ES.GetSubstitution('', '', 0, nonArray, undefined, ''); },
				TypeError,
				'`captures`: ' + debug(nonArray) + ' is not an Array'
			);
		});

		t.equal(
			ES.GetSubstitution('def', 'abcdefghi', 3, [], undefined, '123'),
			'123',
			'returns the substitution'
		);
		t.equal(
			ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], undefined, '$$2$'),
			'$2$',
			'supports $$, and trailing $'
		);

		t.equal(
			ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], undefined, '>$&<'),
			'>abcdef<',
			'supports $&'
		);

		t.equal(
			ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], undefined, '>$`<'),
			'><',
			'supports $` at position 0'
		);
		t.equal(
			ES.GetSubstitution('def', 'abcdefghi', 3, [], undefined, '>$`<'),
			'>ab<',
			'supports $` at position > 0'
		);

		t.equal(
			ES.GetSubstitution('def', 'abcdefghi', 7, [], undefined, ">$'<"),
			'><',
			"supports $' at a position where there's less than `matched.length` chars left"
		);
		t.equal(
			ES.GetSubstitution('def', 'abcdefghi', 3, [], undefined, ">$'<"),
			'>ghi<',
			"supports $' at a position where there's more than `matched.length` chars left"
		);

		for (var i = 0; i < 100; i += 1) {
			var captures = [];
			captures[i] = 'test';
			if (i > 0) {
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], undefined, '>$' + i + '<'),
					'>undefined<',
					'supports $' + i + ' with no captures'
				);
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], undefined, '>$' + i),
					'>undefined',
					'supports $' + i + ' at the end of the replacement, with no captures'
				);
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, captures, undefined, '>$' + i + '<'),
					'><',
					'supports $' + i + ' with a capture at that index'
				);
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, captures, undefined, '>$' + i),
					'>',
					'supports $' + i + ' at the end of the replacement, with a capture at that index'
				);
			}
			if (i < 10) {
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], undefined, '>$0' + i + '<'),
					i === 0 ? '><' : '>undefined<',
					'supports $0' + i + ' with no captures'
				);
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, [], undefined, '>$0' + i),
					i === 0 ? '>' : '>undefined',
					'supports $0' + i + ' at the end of the replacement, with no captures'
				);
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, captures, undefined, '>$0' + i + '<'),
					'><',
					'supports $0' + i + ' with a capture at that index'
				);
				t.equal(
					ES.GetSubstitution('abcdef', 'abcdefghi', 0, captures, undefined, '>$0' + i),
					'>',
					'supports $0' + i + ' at the end of the replacement, with a capture at that index'
				);
			}
		}

		t.test('named captures', function (st) {
			var namedCaptures = {
				foo: 'foo!'
			};

			st.equal(
				ES.GetSubstitution('abcdef', 'abcdefghi', 0, captures, namedCaptures, 'a>$<foo><z'),
				'a>foo!<z',
				'supports named captures'
			);

			st.end();
		});

		t.end();
	});

	test('IsStringPrefix', function (t) {
		forEach(v.nonStrings, function (nonString) {
			t['throws'](
				function () { ES.IsStringPrefix(nonString, 'a'); },
				TypeError,
				'first arg: ' + debug(nonString) + ' is not a string'
			);
			t['throws'](
				function () { ES.IsStringPrefix('a', nonString); },
				TypeError,
				'second arg: ' + debug(nonString) + ' is not a string'
			);
		});

		forEach(v.strings, function (string) {
			t.equal(ES.IsStringPrefix(string, string), true, debug(string) + ' is a prefix of itself');

			t.equal(ES.IsStringPrefix('', string), true, 'the empty string is a prefix of everything');
		});

		t.equal(ES.IsStringPrefix('abc', 'abcd'), true, '"abc" is a prefix of "abcd"');
		t.equal(ES.IsStringPrefix('abcd', 'abc'), false, '"abcd" is not a prefix of "abc"');

		t.equal(ES.IsStringPrefix('a', 'bc'), false, '"a" is not a prefix of "bc"');

		t.end();
	});

	test('NumberToString', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.NumberToString(nonNumber); },
				TypeError,
				debug(nonNumber) + ' is not a Number'
			);
		});

		forEach(v.numbers, function (number) {
			t.equal(ES.NumberToString(number), String(number), debug(number) + ' stringifies to ' + number);
		});

		t.end();
	});

	test('PromiseResolve', function (t) {
		t.test('Promises unsupported', { skip: typeof Promise === 'function' }, function (st) {
			st['throws'](
				function () { ES.PromiseResolve(); },
				SyntaxError,
				'Promises are not supported'
			);
			st.end();
		});

		t.test('Promises supported', { skip: typeof Promise !== 'function' }, function (st) {
			st.plan(2);

			var a = {};
			var b = {};
			var fulfilled = Promise.resolve(a);
			var rejected = Promise.reject(b);

			ES.PromiseResolve(Promise, fulfilled).then(function (x) {
				st.equal(x, a, 'fulfilled promise resolves to fulfilled');
			});

			ES.PromiseResolve(Promise, rejected)['catch'](function (e) {
				st.equal(e, b, 'rejected promise resolves to rejected');
			});
		});

		t.end();
	});

	test('SetFunctionLength', function (t) {
		forEach(v.nonFunctions, function (nonFunction) {
			t['throws'](
				function () { ES.SetFunctionLength(nonFunction, 0); },
				TypeError,
				debug(nonFunction) + ' is not a Function'
			);
		});

		t.test('non-extensible function', { skip: !Object.preventExtensions }, function (st) {
			var F = function F() {};
			Object.preventExtensions(F);

			st['throws'](
				function () { ES.SetFunctionLength(F, 0); },
				TypeError,
				'non-extensible function throws'
			);
			st.end();
		});

		var HasLength = function HasLength(_) { return _; };
		t.equal(has(HasLength, 'length'), true, 'precondition: `HasLength` has own length');
		t['throws'](
			function () { ES.SetFunctionLength(HasLength, 0); },
			TypeError,
			'function with own length throws'
		);

		t.test('no length', { skip: !functionsHaveConfigurableNames }, function (st) {
			var HasNoLength = function HasNoLength() {};
			delete HasNoLength.length;

			st.equal(has(HasNoLength, 'length'), false, 'precondition: `HasNoLength` has no own length');

			forEach(v.nonNumbers, function (nonNumber) {
				st['throws'](
					function () { ES.SetFunctionLength(HasNoLength, nonNumber); },
					TypeError,
					debug(nonNumber) + ' is not a Number'
				);
			});

			forEach([-1, -42, -Infinity, Infinity].concat(v.nonIntegerNumbers), function (nonPositiveInteger) {
				st['throws'](
					function () { ES.SetFunctionLength(HasNoLength, nonPositiveInteger); },
					TypeError,
					debug(nonPositiveInteger) + ' is not a positive integer Number'
				);
			});

			st.end();
		});

		// defines an own configurable non-enum non-write length property

		t.end();
	});

	test('thisSymbolValue', function (t) {
		forEach(v.nonSymbolPrimitives.concat(v.objects), function (nonSymbol) {
			t['throws'](
				function () { ES.thisSymbolValue(nonSymbol); },
				v.hasSymbols ? TypeError : SyntaxError,
				debug(nonSymbol) + ' is not a Symbol'
			);
		});

		t.test('no native Symbols', { skip: v.hasSymbols }, function (st) {
			forEach(v.objects.concat(v.primitives), function (value) {
				st['throws'](
					function () { ES.thisSymbolValue(value); },
					SyntaxError,
					'Symbols are not supported'
				);
			});
			st.end();
		});

		t.test('symbol values', { skip: !v.hasSymbols }, function (st) {
			forEach(v.symbols, function (symbol) {
				st.equal(ES.thisSymbolValue(symbol), symbol, 'Symbol value of ' + debug(symbol) + ' is same symbol');

				st.equal(
					ES.thisSymbolValue(Object(symbol)),
					symbol,
					'Symbol value of ' + debug(Object(symbol)) + ' is ' + debug(symbol)
				);
			});

			st.end();
		});

		t.end();
	});

	test('TimeString', function (t) {
		forEach(v.nonNumbers.concat(NaN), function (nonNumberOrNaN) {
			t['throws'](
				function () { ES.TimeString(nonNumberOrNaN); },
				TypeError,
				debug(nonNumberOrNaN) + ' is not a non-NaN Number'
			);
		});

		var tv = Date.UTC(2019, 8, 10, 7, 8, 9);
		t.equal(ES.TimeString(tv), '07:08:09 GMT');
		t.end();
	});

	test('UnicodeEscape', function (t) {
		forEach(v.nonStrings, function (nonString) {
			t['throws'](
				function () { ES.UnicodeEscape(nonString); },
				TypeError,
				debug(nonString) + ' is not a String'
			);
		});
		t['throws'](
			function () { ES.UnicodeEscape(''); },
			TypeError,
			'empty string does not have length 1'
		);
		t['throws'](
			function () { ES.UnicodeEscape('ab'); },
			TypeError,
			'2-char string does not have length 1'
		);

		t.equal(ES.UnicodeEscape(' '), '\\u0020');
		t.equal(ES.UnicodeEscape('a'), '\\u0061');
		t.equal(ES.UnicodeEscape(leadingPoo), '\\ud83d');
		t.equal(ES.UnicodeEscape(trailingPoo), '\\udca9');

		t.end();
	});
};

var es2019 = function ES2019(ES, ops, expectedMissing, skips) {
	es2018(ES, ops, expectedMissing, assign({}, skips, {
	}));
	var test = makeTest(skips);

	test('AddEntriesFromIterable', function (t) {
		t['throws'](
			function () { ES.AddEntriesFromIterable({}, undefined, function () {}); },
			TypeError,
			'iterable must not be undefined'
		);
		t['throws'](
			function () { ES.AddEntriesFromIterable({}, null, function () {}); },
			TypeError,
			'iterable must not be null'
		);
		forEach(v.nonFunctions, function (nonFunction) {
			t['throws'](
				function () { ES.AddEntriesFromIterable({}, {}, nonFunction); },
				TypeError,
				debug(nonFunction) + ' is not a function'
			);
		});

		t.test('Symbol support', { skip: !v.hasSymbols }, function (st) {
			st.plan(4);

			var O = {};
			st.equal(ES.AddEntriesFromIterable(O, [], function () {}), O, 'returns the target');

			var adder = function (key, value) {
				st.equal(this, O, 'adder gets proper receiver');
				st.equal(key, 0, 'k is key');
				st.equal(value, 'a', 'v is value');
			};
			ES.AddEntriesFromIterable(O, ['a'].entries(), adder);

			st.end();
		});

		t.end();
	});

	test('FlattenIntoArray', function (t) {
		t.test('no mapper function', function (st) {
			var testDepth = function testDepth(tt, depth, expected) {
				var a = [];
				var o = [[1], 2, , [[3]], [], 4, [[[[5]]]]]; // eslint-disable-line no-sparse-arrays
				ES.FlattenIntoArray(a, o, o.length, 0, depth);
				tt.deepEqual(a, expected, 'depth: ' + depth);
			};

			testDepth(st, 1, [1, 2, [3], 4, [[[5]]]]);
			testDepth(st, 2, [1, 2, 3, 4, [[5]]]);
			testDepth(st, 3, [1, 2, 3, 4, [5]]);
			testDepth(st, 4, [1, 2, 3, 4, 5]);
			testDepth(st, Infinity, [1, 2, 3, 4, 5]);
			st.end();
		});

		t.test('mapper function', function (st) {
			var testMapper = function testMapper(tt, mapper, expected, thisArg) {
				var a = [];
				var o = [[1], 2, , [[3]], [], 4, [[[[5]]]]]; // eslint-disable-line no-sparse-arrays
				ES.FlattenIntoArray(a, o, o.length, 0, 1, mapper, thisArg);
				tt.deepEqual(a, expected);
			};

			var double = function double(x) {
				return typeof x === 'number' ? 2 * x : x;
			};
			testMapper(
				st,
				double,
				[1, 4, [3], 8, [[[5]]]]
			);
			var receiver = hasStrictMode ? 42 : Object(42);
			testMapper(
				st,
				function (x) { return [this, double(x)]; },
				[receiver, [1], receiver, 4, receiver, [[3]], receiver, [], receiver, 8, receiver, [[[[5]]]]],
				42
			);
			st.end();
		});

		t.end();
	});

	test('TrimString', function (t) {
		t.test('non-object string', function (st) {
			forEach(v.nullPrimitives, function (nullish) {
				st['throws'](
					function () { ES.TrimString(nullish); },
					debug(nullish) + ' is not an Object'
				);
			});
			st.end();
		});

		var string = ' \n abc  \n ';
		t.equal(ES.TrimString(string, 'start'), string.slice(string.indexOf('a')));
		t.equal(ES.TrimString(string, 'end'), string.slice(0, string.lastIndexOf('c') + 1));
		t.equal(ES.TrimString(string, 'start+end'), string.slice(string.indexOf('a'), string.lastIndexOf('c') + 1));

		t.end();
	});
};

var es2020 = function ES2020(ES, ops, expectedMissing, skips) {
	es2019(ES, ops, expectedMissing, assign({}, skips, {
		CopyDataProperties: true,
		GetIterator: true,
		NumberToString: true,
		ObjectCreate: true,
		SameValueNonNumber: true,
		ToInteger: true,
		UTF16Decode: true
	}));
	var test = makeTest(skips);

	test('BigInt::add', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.add(nonBigInt, 0); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.add(0, nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		t.equal(ES.BigInt.add($BigInt(0), $BigInt(0)), $BigInt(0), '0n + 0n is 0n');

		forEach(v.bigints, function (bigint) {
			if (bigint !== $BigInt(0)) {
				t.equal(ES.BigInt.add(bigint, $BigInt(0)), bigint, debug(bigint) + ' + 0n adds to ' + bigint);
			}
			t.equal(ES.BigInt.add(bigint, $BigInt(1)), bigint + $BigInt(1), debug(bigint) + ' + 1n adds to ' + (bigint + $BigInt(1)));
			t.equal(ES.BigInt.add(bigint, -$BigInt(42)), bigint - $BigInt(42), debug(bigint) + ' + -42n adds to ' + (bigint - $BigInt(42)));
		});

		t.end();
	});

	test('BigInt::bitwiseAND', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.bitwiseAND(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.bitwiseAND($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		t.equal(ES.BigInt.bitwiseAND($BigInt(1), $BigInt(2)), $BigInt(1) & $BigInt(2));

		t.end();
	});

	test('BigInt::bitwiseNOT', function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.bitwiseNOT(nonBigInt); },
				TypeError,
				debug(nonBigInt) + ' is not a BigInt'
			);
		});

		t.test('actual BigInts', { skip: !hasBigInts }, function (st) {
			forEach(v.int32s, function (int32) {
				var bigInt32 = $BigInt(int32);
				st.equal(ES.BigInt.bitwiseNOT(bigInt32), ~bigInt32, debug(bigInt32) + ' becomes ~' + debug(bigInt32));
			});
			st.end();
		});

		t.end();
	});

	test('BigInt::bitwiseOR', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.bitwiseOR(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.bitwiseOR($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		t.equal(ES.BigInt.bitwiseOR($BigInt(1), $BigInt(2)), $BigInt(1) | $BigInt(2));

		t.end();
	});

	test('BigInt::bitwiseXOR', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.bitwiseXOR(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.bitwiseXOR($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		t.equal(ES.BigInt.bitwiseXOR($BigInt(1), $BigInt(2)), $BigInt(1) ^ $BigInt(2));

		t.end();
	});

	test('BigInt::divide', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.divide(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.divide($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		t['throws'](
			function () { ES.BigInt.divide($BigInt(1), $BigInt(0)); },
			RangeError,
			'dividing by zero throws'
		);

		forEach(v.bigints, function (bigint) {
			if (bigint !== $BigInt(0)) {
				t.equal(ES.BigInt.divide(bigint, bigint), $BigInt(1), debug(bigint) + ' divided by itself is 1n');
				t.equal(ES.BigInt.divide(bigint, $BigInt(2)), bigint / $BigInt(2), debug(bigint) + ' divided by 2n is half itself');
			}
		});

		t.end();
	});

	test('BigInt::equal', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.equal(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.Number.equal($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a Number'
			);
		});

		forEach(v.bigints, function (bigint) {
			if (BigInt !== $BigInt(0)) {
				t.equal(ES.BigInt.equal(bigint, bigint), true, debug(bigint) + ' is equal to itself');
				t.equal(ES.BigInt.equal(bigint, bigint + $BigInt(1)), false, debug(bigint) + ' is not equal to itself plus 1n');
			}
		});

		t.end();
	});

	test('BigInt::exponentiate', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.exponentiate(nonBigInt, $BigInt(0)); },
				TypeError,
				'base: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.exponentiate($BigInt(0), nonBigInt); },
				TypeError,
				'exponent: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		t['throws'](
			function () { ES.BigInt.exponentiate($BigInt(1), -$BigInt(1)); },
			RangeError,
			'negative exponent throws'
		);

		forEach(v.bigints, function (bigint) {
			if (bigint !== $BigInt(0)) {
				t.equal(ES.BigInt.exponentiate(bigint, $BigInt(0)), $BigInt(1), debug(bigint) + ' ** 0n is 1n');

				var square = bigint;
				for (var i = 0; i < Number(bigint); i += 1) {
					square += bigint;
				}
				t.equal(ES.BigInt.exponentiate(bigint, bigint), square, debug(bigint) + ' ** ' + debug(bigint) + ' is equal to ' + debug(square));
			}
		});

		t.end();
	});

	test('BigInt::leftShift', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.leftShift(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.leftShift($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		forEach([0].concat(v.int32s), function (int32) {
			var bigInt32 = $BigInt(int32);
			forEach([1, 3, 5, 31, 32, 33], function (bits) {
				var bitsN = $BigInt(bits);
				t.equal(
					ES.BigInt.leftShift(bigInt32, bitsN),
					bigInt32 << bitsN,
					debug(bigInt32) + ' << ' + debug(bitsN) + ' is ' + debug(bigInt32 << bitsN)
				);
			});
		});

		t.end();
	});

	test('BigInt::lessThan', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.lessThan(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.lessThan($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		t.equal(ES.BigInt.lessThan($BigInt(0), $BigInt(0)), false, '0n < 0n is false');

		forEach(v.bigints, function (bigint) {
			t.equal(ES.BigInt.lessThan(bigint, bigint), false, debug(bigint) + ' is not less than itself');

			t.equal(ES.BigInt.lessThan(bigint, bigint + $BigInt(1)), true, debug(bigint) + ' < ' + debug(bigint + $BigInt(1)) + ' is true');
			t.equal(ES.BigInt.lessThan(bigint + $BigInt(1), bigint), false, debug(bigint + $BigInt(1)) + ' < ' + debug(bigint) + ' is false');
		});

		t.end();
	});

	test('BigInt::multiply', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.multiply(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.multiply($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a Number'
			);
		});

		t.equal(ES.BigInt.multiply($BigInt(0), $BigInt(0)), $BigInt(0), '0n * 0n is 0n');

		forEach(v.bigints, function (bigint) {
			if (bigint !== $BigInt(0)) {
				t.equal(ES.BigInt.multiply(bigint, $BigInt(0)), $BigInt(0), debug(bigint) + ' * 0n produces 0n');
				t.equal(ES.BigInt.multiply(bigint, $BigInt(1)), bigint, debug(bigint) + ' * 1n produces itself');
				t.equal(ES.BigInt.multiply(bigint, -$BigInt(42)), bigint * -$BigInt(42), debug(bigint) + ' * -42n produces ' + (bigint - $BigInt(42)));
			}
		});

		t.end();
	});

	test('BigInt::remainder', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.remainder(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.remainder($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		t['throws'](
			function () { ES.BigInt.remainder($BigInt(1), $BigInt(0)); },
			RangeError,
			'dividing by zero throws'
		);

		forEach(v.bigints, function (bigint) {
			if (bigint !== $BigInt(0)) {
				t.equal(
					ES.BigInt.remainder($BigInt(0), bigint),
					$BigInt(0),
					'0n % ' + debug(bigint) + ' is 0n'
				);
				t.equal(
					ES.BigInt.remainder(bigint + $BigInt(1), bigint),
					$BigInt(1),
					debug(bigint) + ' % ' + debug(bigint + $BigInt(1)) + ' is 1n'
				);
			}
		});

		t.end();
	});

	test('BigInt::sameValue', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.sameValue(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.sameValue($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		t.equal(ES.BigInt.sameValue($BigInt(0), $BigInt(0)), true, '0n is sameValue as 0n');

		forEach(v.bigints, function (bigint) {
			t.ok(ES.BigInt.sameValue(bigint, bigint), debug(bigint) + ' is the sameValue as itself');
		});

		t.end();
	});

	test('BigInt::sameValueZero', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.sameValueZero(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.sameValueZero($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		forEach(v.bigints, function (bigint) {
			t.ok(ES.BigInt.sameValueZero(bigint, bigint), debug(bigint) + ' is the sameValueZero as itself');
		});

		t.end();
	});

	test('BigInt::signedRightShift', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.signedRightShift(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.signedRightShift($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		forEach([0].concat(v.int32s), function (int32) {
			var bigInt32 = $BigInt(int32);
			forEach([1, 3, 5, 31, 32, 33], function (bits) {
				var bitsN = $BigInt(bits);
				t.equal(
					ES.BigInt.signedRightShift(bigInt32, bitsN),
					bigInt32 >> bitsN,
					debug(bigInt32) + ' >> ' + debug(bitsN) + ' is ' + debug(bigInt32 >> bitsN)
				);
			});
		});

		t.end();
	});

	test('BigInt::subtract', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.subtract(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.subtract($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		t.equal(ES.BigInt.subtract($BigInt(0), $BigInt(0)), $BigInt(0), '0n - 0n is 0n');

		forEach(v.bigints, function (bigint) {
			t.equal(ES.BigInt.subtract(bigint, $BigInt(0)), bigint, debug(bigint) + ' - 0n produces ' + bigint);
			t.equal(ES.BigInt.subtract(bigint, $BigInt(1)), bigint - $BigInt(1), debug(bigint) + ' - 1n produces ' + (bigint + $BigInt(1)));
			t.equal(ES.BigInt.subtract(bigint, $BigInt(42)), bigint - $BigInt(42), debug(bigint) + ' - 42n produces ' + (bigint - $BigInt(42)));
		});

		t.end();
	});

	test('BigInt::toString', function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.toString(nonBigInt); },
				TypeError,
				debug(nonBigInt) + ' is not a BigInt'
			);
		});

		forEach(v.bigints, function (bigint) {
			t.equal(ES.BigInt.toString(bigint), String(bigint), debug(bigint) + ' stringifies to ' + bigint);
		});

		t.end();
	});

	test('BigInt::unaryMinus', function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.unaryMinus(nonBigInt); },
				TypeError,
				debug(nonBigInt) + ' is not a BigInt'
			);
		});

		t.test('actual BigInts', { skip: !hasBigInts }, function (st) {
			forEach(v.bigints, function (bigint) {
				st.equal(ES.BigInt.unaryMinus(bigint), -bigint, debug(bigint) + ' produces -' + debug(bigint));
			});
			st.end();
		});

		t.end();
	});

	test('BigInt::unsignedRightShift', { skip: !hasBigInts }, function (t) {
		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.BigInt.unsignedRightShift(nonBigInt, $BigInt(0)); },
				TypeError,
				'x: ' + debug(nonBigInt) + ' is not a BigInt'
			);
			t['throws'](
				function () { ES.BigInt.unsignedRightShift($BigInt(0), nonBigInt); },
				TypeError,
				'y: ' + debug(nonBigInt) + ' is not a BigInt'
			);
		});

		forEach([0].concat(v.int32s), function (int32) {
			var bigInt32 = $BigInt(int32);
			forEach([1, 3, 5, 31, 32, 33], function (bits) {
				var bitsN = $BigInt(bits);
				t['throws'](
					function () { ES.BigInt.unsignedRightShift(bigInt32, bitsN); },
					TypeError,
					debug(bigInt32) + ' >>> ' + debug(bitsN) + ' throws'
				);
			});
		});

		t.end();
	});

	test('BigIntBitwiseOp', { skip: !hasBigInts }, function (t) {
		t['throws'](
			function () { ES.BigIntBitwiseOp('invalid', BigInt(0), BigInt(0)); },
			TypeError,
			'throws with an invalid op'
		);

		t.equal(ES.BigIntBitwiseOp('&', BigInt(1), BigInt(2)), BigInt(1) & BigInt(2));
		t.equal(ES.BigIntBitwiseOp('|', BigInt(1), BigInt(2)), BigInt(1) | BigInt(2));
		t.equal(ES.BigIntBitwiseOp('^', BigInt(1), BigInt(2)), BigInt(1) ^ BigInt(2));

		t.end();
	});

	test('BinaryAnd', function (t) {
		t.equal(ES.BinaryAnd(0, 0), 0);
		t.equal(ES.BinaryAnd(0, 1), 0);
		t.equal(ES.BinaryAnd(1, 0), 0);
		t.equal(ES.BinaryAnd(1, 1), 1);

		forEach(v.nonIntegerNumbers.concat(v.nonNumberPrimitives, v.objects), function (nonBit) {
			t['throws'](
				function () { ES.BinaryAnd(0, nonBit); },
				TypeError
			);
			t['throws'](
				function () { ES.BinaryAnd(nonBit, 1); },
				TypeError
			);
		});
		t.end();
	});

	test('BinaryOr', function (t) {
		t.equal(ES.BinaryOr(0, 0), 0);
		t.equal(ES.BinaryOr(0, 1), 1);
		t.equal(ES.BinaryOr(1, 0), 1);
		t.equal(ES.BinaryOr(1, 1), 1);

		forEach(v.nonIntegerNumbers.concat(v.nonNumberPrimitives, v.objects), function (nonBit) {
			t['throws'](
				function () { ES.BinaryOr(0, nonBit); },
				TypeError
			);
			t['throws'](
				function () { ES.BinaryOr(nonBit, 1); },
				TypeError
			);
		});
		t.end();
	});

	test('BinaryXor', function (t) {
		t.equal(ES.BinaryXor(0, 0), 0);
		t.equal(ES.BinaryXor(0, 1), 1);
		t.equal(ES.BinaryXor(1, 0), 1);
		t.equal(ES.BinaryXor(1, 1), 0);

		forEach(v.nonIntegerNumbers.concat(v.nonNumberPrimitives, v.objects), function (nonBit) {
			t['throws'](
				function () { ES.BinaryXor(0, nonBit); },
				TypeError
			);
			t['throws'](
				function () { ES.BinaryXor(nonBit, 1); },
				TypeError
			);
		});
		t.end();
	});

	test('CodePointAt', function (t) {
		t['throws'](
			function () { ES.CodePointAt('abc', -1); },
			TypeError,
			'requires an index >= 0'
		);
		t['throws'](
			function () { ES.CodePointAt('abc', 3); },
			TypeError,
			'requires an index < string length'
		);

		t.deepEqual(ES.CodePointAt('abc', 0), {
			'[[CodePoint]]': 'a',
			'[[CodeUnitCount]]': 1,
			'[[IsUnpairedSurrogate]]': false
		});
		t.deepEqual(ES.CodePointAt('abc', 1), {
			'[[CodePoint]]': 'b',
			'[[CodeUnitCount]]': 1,
			'[[IsUnpairedSurrogate]]': false
		});
		t.deepEqual(ES.CodePointAt('abc', 2), {
			'[[CodePoint]]': 'c',
			'[[CodeUnitCount]]': 1,
			'[[IsUnpairedSurrogate]]': false
		});

		var strWithHalfPoo = 'a' + leadingPoo + 'c';
		var strWithWholePoo = 'a' + wholePoo + 'd';

		t.deepEqual(ES.CodePointAt(strWithHalfPoo, 0), {
			'[[CodePoint]]': 'a',
			'[[CodeUnitCount]]': 1,
			'[[IsUnpairedSurrogate]]': false
		});
		t.deepEqual(ES.CodePointAt(strWithHalfPoo, 1), {
			'[[CodePoint]]': leadingPoo,
			'[[CodeUnitCount]]': 1,
			'[[IsUnpairedSurrogate]]': true
		});
		t.deepEqual(ES.CodePointAt(strWithHalfPoo, 2), {
			'[[CodePoint]]': 'c',
			'[[CodeUnitCount]]': 1,
			'[[IsUnpairedSurrogate]]': false
		});

		t.deepEqual(ES.CodePointAt(strWithWholePoo, 0), {
			'[[CodePoint]]': 'a',
			'[[CodeUnitCount]]': 1,
			'[[IsUnpairedSurrogate]]': false
		});
		t.deepEqual(ES.CodePointAt(strWithWholePoo, 1), {
			'[[CodePoint]]': wholePoo,
			'[[CodeUnitCount]]': 2,
			'[[IsUnpairedSurrogate]]': false
		});
		t.deepEqual(ES.CodePointAt(strWithWholePoo, 2), {
			'[[CodePoint]]': trailingPoo,
			'[[CodeUnitCount]]': 1,
			'[[IsUnpairedSurrogate]]': true
		});
		t.deepEqual(ES.CodePointAt(strWithWholePoo, 3), {
			'[[CodePoint]]': 'd',
			'[[CodeUnitCount]]': 1,
			'[[IsUnpairedSurrogate]]': false
		});

		t.end();
	});

	test('CopyDataProperties', function (t) {
		t.test('first argument: target', function (st) {
			forEach(v.primitives, function (primitive) {
				st['throws'](
					function () { ES.CopyDataProperties(primitive, {}, []); },
					TypeError,
					debug(primitive) + ' is not an Object'
				);
			});
			st.end();
		});

		t.test('second argument: source', function (st) {
			var frozenTarget = Object.freeze ? Object.freeze({}) : {};
			forEach(v.nullPrimitives, function (nullish) {
				st.equal(
					ES.CopyDataProperties(frozenTarget, nullish, []),
					frozenTarget,
					debug(nullish) + ' "source" yields identical, unmodified target'
				);
			});

			forEach(v.nonNullPrimitives, function (objectCoercible) {
				var target = {};
				var result = ES.CopyDataProperties(target, objectCoercible, []);
				st.equal(result, target, 'result === target');
				st.deepEqual(keys(result), keys(Object(objectCoercible)), 'target ends up with keys of ' + debug(objectCoercible));
			});

			st.test('enumerable accessor property', { skip: !defineProperty.oDP }, function (s2t) {
				var target = {};
				var source = {};
				defineProperty(source, 'a', {
					enumerable: true,
					get: function () { return 42; }
				});
				var result = ES.CopyDataProperties(target, source, []);
				s2t.equal(result, target, 'result === target');
				s2t.deepEqual(result, { a: 42 }, 'target ends up with enumerable accessor of source');
				s2t.end();
			});

			st.end();
		});

		t.test('third argument: excludedItems', function (st) {
			forEach(v.objects.concat(v.primitives), function (nonArray) {
				st['throws'](
					function () { ES.CopyDataProperties({}, {}, nonArray); },
					TypeError,
					debug(nonArray) + ' is not an Array'
				);
			});

			forEach(v.nonPropertyKeys, function (nonPropertyKey) {
				st['throws'](
					function () { ES.CopyDataProperties({}, {}, [nonPropertyKey]); },
					TypeError,
					debug(nonPropertyKey) + ' is not a Property Key'
				);
			});

			var result = ES.CopyDataProperties({}, { a: 1, b: 2, c: 3 }, ['b']);
			st.deepEqual(keys(result).sort(), ['a', 'c'].sort(), 'excluded string keys are excluded');

			st.test('excluding symbols', { skip: !v.hasSymbols }, function (s2t) {
				var source = {};
				forEach(v.symbols, function (symbol) {
					source[symbol] = true;
				});

				var includedSymbols = v.symbols.slice(1);
				var excludedSymbols = v.symbols.slice(0, 1);
				var target = ES.CopyDataProperties({}, source, excludedSymbols);

				forEach(includedSymbols, function (symbol) {
					s2t.equal(has(target, symbol), true, debug(symbol) + ' is included');
				});

				forEach(excludedSymbols, function (symbol) {
					s2t.equal(has(target, symbol), false, debug(symbol) + ' is excluded');
				});

				s2t.end();
			});

			st.end();
		});

		// TODO: CopyDataProperties throws when copying fails

		t.end();
	});

	test('GetIterator', function (t) {
		try {
			ES.GetIterator({}, null);
		} catch (e) {
			t.ok(e.message.indexOf('Assertion failed: `hint` must be one of \'sync\' or \'async\'' >= 0));
		}

		var arr = [1, 2];
		testIterator(t, ES.GetIterator(arr), arr);

		testIterator(t, ES.GetIterator('abc'), 'abc'.split(''));

		t.test('Symbol.iterator', { skip: !v.hasSymbols }, function (st) {
			var m = new Map();
			m.set(1, 'a');
			m.set(2, 'b');

			testIterator(st, ES.GetIterator(m), [[1, 'a'], [2, 'b']]);

			st.end();
		});

		t.test('Symbol.asyncIterator', { skip: !v.hasSymbols || !Symbol.asyncIterator }, function (st) {
			try {
				ES.GetIterator(arr, 'async');
			} catch (e) {
				st.ok(e.message.indexOf("async from sync iterators aren't currently supported") >= 0);
			}

			var it = {
				next: function () {
					return Promise.resolve({
						done: true
					});
				}
			};
			var obj = {};
			obj[Symbol.asyncIterator] = function () {
				return it;
			};

			st.equal(ES.GetIterator(obj, 'async'), it);

			st.end();
		});

		t.end();
	});

	var unclampedUnsignedIntegerTypes = [
		'Int8',
		'Int16',
		'Int32'
	];
	var clampedTypes = [
		'Uint8C'
	];
	var unclampedSignedIntegerTypes = [
		'Uint8',
		'Uint16',
		'Uint32'
	];
	var unclampedIntegerTypes = unclampedUnsignedIntegerTypes.concat(unclampedSignedIntegerTypes);
	var floatTypes = [
		'Float32',
		'Float64'
	];
	var integerTypes = unclampedIntegerTypes.concat(clampedTypes, floatTypes);
	var bigIntTypes = [
		'BigInt64',
		'BigUint64'
	];
	var numberTypes = floatTypes.concat(integerTypes);
	var nonIntegerTypes = floatTypes.concat(bigIntTypes);
	var unsignedElementTypes = unclampedSignedIntegerTypes.concat([
		'BigUint64'
	]);
	var signedElementTypes = unclampedUnsignedIntegerTypes;

	test('IsBigIntElementType', function (t) {
		forEach(bigIntTypes, function (type) {
			t.equal(
				ES.IsBigIntElementType(type),
				true,
				debug(type) + ' is a BigInt element type'
			);
		});

		forEach(numberTypes, function (type) {
			t.equal(
				ES.IsBigIntElementType(type),
				false,
				debug(type) + ' is not a BigInt element type'
			);
		});

		t.end();
	});

	test('IsUnsignedElementType', function (t) {
		forEach(unsignedElementTypes, function (type) {
			t.equal(
				ES.IsUnsignedElementType(type),
				true,
				debug(type) + ' is an unsigned element type'
			);
		});

		forEach(signedElementTypes, function (type) {
			t.equal(
				ES.IsUnsignedElementType(type),
				false,
				debug(type) + ' is not an unsigned element type'
			);
		});

		t.end();
	});

	test('IsUnclampedIntegerElementType', function (t) {
		forEach(unclampedIntegerTypes, function (type) {
			t.equal(
				ES.IsUnclampedIntegerElementType(type),
				true,
				debug(type) + ' is an unclamped integer element type'
			);
		});

		forEach(clampedTypes.concat(nonIntegerTypes), function (type) {
			t.equal(
				ES.IsUnclampedIntegerElementType(type),
				false,
				debug(type) + ' is not an unclamped integer element type'
			);
		});

		t.end();
	});

	test('IsNonNegativeInteger', function (t) {
		forEach(v.notNonNegativeIntegers, function (nonIntegerNumber) {
			t.equal(
				ES.IsNonNegativeInteger(nonIntegerNumber),
				false,
				debug(nonIntegerNumber) + ' is not a non-negative integer'
			);
		});

		forEach(v.zeroes.concat(v.integerNumbers), function (nonNegativeInteger) {
			t.equal(
				ES.IsNonNegativeInteger(nonNegativeInteger),
				true,
				debug(nonNegativeInteger) + ' is a non-negative integer'
			);
		});

		t.end();
	});

	test('IsNoTearConfiguration', function (t) {
		forEach(unclampedIntegerTypes, function (type) {
			t.equal(
				ES.IsNoTearConfiguration(type),
				true,
				debug(type) + ' with any order is a no-tear configuration'
			);
		});

		forEach(bigIntTypes, function (type) {
			t.equal(
				ES.IsNoTearConfiguration(type, 'Init'),
				false,
				debug(type) + ' with ' + debug('Init') + ' is not a no-tear configuration'
			);

			t.equal(
				ES.IsNoTearConfiguration(type, 'Unordered'),
				false,
				debug(type) + ' with ' + debug('Unordered') + ' is not a no-tear configuration'
			);

			t.equal(
				ES.IsNoTearConfiguration(type),
				true,
				debug(type) + ' with any other order is a no-tear configuration'
			);
		});

		forEach(clampedTypes, function (type) {
			t.equal(
				ES.IsNoTearConfiguration(type),
				false,
				debug(type) + ' with any order is not a no-tear configuration'
			);
		});

		t.end();
	});

	test('LengthOfArrayLike', function (t) {
		forEach(v.primitives, function (primitive) {
			t['throws'](
				function () { ES.LengthOfArrayLike(primitive); },
				TypeError,
				debug(primitive) + ' is not an Object'
			);
		});

		t.equal(ES.LengthOfArrayLike([]), 0);
		t.equal(ES.LengthOfArrayLike([1]), 1);
		t.equal(ES.LengthOfArrayLike({ length: 42 }), 42);

		t.end();
	});

	test('Number::add', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.add(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.add(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		t.equal(ES.Number.add(+Infinity, +Infinity), +Infinity, '+∞ + +∞ is +∞');
		t.equal(ES.Number.add(-Infinity, -Infinity), -Infinity, '-∞ + -∞ is -∞');
		t.equal(ES.Number.add(+Infinity, -Infinity), NaN, '+∞ + -∞ is NaN');
		t.equal(ES.Number.add(-Infinity, +Infinity), NaN, '-∞ + +∞ is NaN');

		t.equal(ES.Number.add(+0, +0), +0, '0 + 0 is +0');
		t.equal(ES.Number.add(+0, -0), +0, '0 + -0 is +0');
		t.equal(ES.Number.add(-0, +0), +0, '-0 + 0 is +0');
		t.equal(ES.Number.add(-0, -0), -0, '-0 + -0 is -0');

		forEach(v.numbers, function (number) {
			if (number !== 0) {
				t.equal(ES.Number.add(number, 0), number, debug(number) + ' + 0 adds to ' + number);
			}
			t.equal(ES.Number.add(number, 1), number + 1, debug(number) + ' + 1 adds to ' + (number + 1));
			t.equal(ES.Number.add(1, number), number + 1, '1 + ' + debug(number) + ' adds to ' + (number + 1));
			t.equal(ES.Number.add(number, -42), number - 42, debug(number) + ' + -42 adds to ' + (number - 42));
			t.equal(ES.Number.add(-42, number), number - 42, '-42 + ' + debug(number) + ' adds to ' + (number - 42));
		});

		t.end();
	});

	test('Number::bitwiseAND', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.bitwiseAND(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.bitwiseAND(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		t.equal(ES.Number.bitwiseAND(1, 2), 1 & 2);

		t.end();
	});

	test('Number::bitwiseNOT', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.bitwiseNOT(nonNumber); },
				TypeError,
				debug(nonNumber) + ' is not a Number'
			);
		});

		forEach(v.int32s, function (int32) {
			t.equal(ES.Number.bitwiseNOT(int32), ~int32, debug(int32) + ' becomes ~' + debug(int32));
		});

		t.end();
	});

	test('Number::bitwiseOR', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.bitwiseOR(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.bitwiseOR(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		t.equal(ES.Number.bitwiseOR(1, 2), 1 | 2);

		t.end();
	});

	test('Number::bitwiseXOR', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.bitwiseXOR(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.bitwiseXOR(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		t.equal(ES.Number.bitwiseXOR(1, 2), 1 ^ 2);

		t.end();
	});

	test('Number::divide', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.divide(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.divide(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		t.equal(ES.Number.divide(Infinity, Infinity), NaN, '∞ / ∞ is NaN');
		t.equal(ES.Number.divide(-Infinity, Infinity), NaN, '-∞ / ∞ is NaN');
		t.equal(ES.Number.divide(Infinity, -Infinity), NaN, '∞ / -∞ is NaN');
		t.equal(ES.Number.divide(-Infinity, -Infinity), NaN, '-∞ / -∞ is NaN');

		t.equal(ES.Number.divide(NaN, NaN), NaN, 'NaN / NaN is NaN');

		t.equal(ES.Number.divide(+Infinity, +0), +Infinity, '+∞ / +0 is +∞');
		t.equal(ES.Number.divide(-Infinity, -0), +Infinity, '-∞ / -0 is +∞');
		t.equal(ES.Number.divide(+Infinity, -0), -Infinity, '+∞ / -0 is -∞');
		t.equal(ES.Number.divide(-Infinity, +0), -Infinity, '-∞ / +0 is -∞');

		t.equal(ES.Number.divide(+0, +Infinity), +0, '+0 / +∞ is +0');
		t.equal(ES.Number.divide(-0, -Infinity), +0, '-0 / -∞ is +0');
		t.equal(ES.Number.divide(-0, +Infinity), -0, '-0 / +∞ is -0');
		t.equal(ES.Number.divide(+0, -Infinity), -0, '+0 / -∞ is -0');

		forEach(v.numbers, function (number) {
			if (number !== 0 && isFinite(number)) {
				t.equal(ES.Number.divide(number, number), 1, debug(number) + ' divided by itself is 1');
				t.equal(ES.Number.divide(number, 2), number / 2, debug(number) + ' divided by 2 is half itself');
			}
		});

		t.end();
	});

	test('Number::equal', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.equal(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.equal(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		t.equal(ES.Number.equal(Infinity, Infinity), true, '∞ === ∞');
		t.equal(ES.Number.equal(-Infinity, Infinity), false, '-∞ !== ∞');
		t.equal(ES.Number.equal(Infinity, -Infinity), false, '∞ !== -∞');
		t.equal(ES.Number.equal(-Infinity, -Infinity), true, '-∞ === -∞');

		t.equal(ES.Number.equal(NaN, NaN), false, 'NaN !== NaN');

		t.equal(ES.Number.equal(Infinity, 0), false, '∞ !== 0');
		t.equal(ES.Number.equal(-Infinity, -0), false, '-∞ !== -0');
		t.equal(ES.Number.equal(Infinity, -0), false, '∞ !== -0');
		t.equal(ES.Number.equal(-Infinity, 0), false, '-∞ !== 0');

		t.equal(ES.Number.equal(+0, +0), true, '+0 === +0');
		t.equal(ES.Number.equal(+0, -0), true, '+0 === -0');
		t.equal(ES.Number.equal(-0, +0), true, '-0 === +0');
		t.equal(ES.Number.equal(-0, -0), true, '-0 === -0');

		forEach(v.numbers, function (number) {
			if (isFinite(number)) {
				t.equal(ES.Number.equal(number, number), true, debug(number) + ' is equal to itself');
				t.equal(ES.Number.equal(number, number + 1), false, debug(number) + ' is not equal to itself plus 1');
			}
		});

		t.end();
	});

	test('Number::exponentiate', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.exponentiate(nonNumber, 0); },
				TypeError,
				'base: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.exponentiate(0, nonNumber); },
				TypeError,
				'exponent: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		t.equal(ES.Number.exponentiate(0, 42), 0, '+0 ** 42 is +0');
		t.equal(ES.Number.exponentiate(0, -42), Infinity, '+0 ** 42 is +∞');
		t.equal(ES.Number.exponentiate(-0, 42), 0, '-0 ** 42 is +0');
		t.equal(ES.Number.exponentiate(-0, 41), -0, '-0 ** 41 is -0');
		t.equal(ES.Number.exponentiate(-0, -42), Infinity, '-0 ** 42 is +∞');
		t.equal(ES.Number.exponentiate(-0, -41), -Infinity, '-0 ** 41 is -∞');

		t.equal(ES.Number.exponentiate(Infinity, 0), 1, '+∞ ** 0 is 1');
		t.equal(ES.Number.exponentiate(Infinity, -0), 1, '+∞ ** -0 is 1');
		t.equal(ES.Number.exponentiate(-Infinity, 0), 1, '-∞ ** 0 is 1');
		t.equal(ES.Number.exponentiate(-Infinity, -0), 1, '-∞ ** -0 is 1');

		t.equal(ES.Number.exponentiate(Infinity, 1), Infinity, '+∞ ** 1 is +∞');
		t.equal(ES.Number.exponentiate(Infinity, 2), Infinity, '+∞ ** 2 is +∞');
		t.equal(ES.Number.exponentiate(Infinity, -1), +0, '+∞ ** -1 is +0');
		t.equal(ES.Number.exponentiate(Infinity, -2), +0, '+∞ ** -2 is +0');

		t.equal(ES.Number.exponentiate(-Infinity, 1), -Infinity, '-∞ ** 1 is -∞');
		t.equal(ES.Number.exponentiate(-Infinity, 2), Infinity, '-∞ ** 2 is +∞');
		t.equal(ES.Number.exponentiate(-Infinity, -1), -0, '-∞ ** --1 is -0');
		t.equal(ES.Number.exponentiate(-Infinity, -2), +0, '-∞ ** --2 is +0');

		t.equal(ES.Number.exponentiate(1.1, Infinity), Infinity, '1.1 ** +∞ is +∞');
		t.equal(ES.Number.exponentiate(1.1, -Infinity), 0, '1.1 ** -∞ is +0');
		t.equal(ES.Number.exponentiate(-1.1, Infinity), Infinity, '-1.1 ** +∞ is +∞');
		t.equal(ES.Number.exponentiate(-1.1, -Infinity), 0, '-1.1 ** -∞ is +0');

		t.equal(ES.Number.exponentiate(1, Infinity), NaN, '1 ** +∞ is NaN');
		t.equal(ES.Number.exponentiate(1, -Infinity), NaN, '1 ** -∞ is NaN');
		t.equal(ES.Number.exponentiate(-1, Infinity), NaN, '-1 ** +∞ is NaN');
		t.equal(ES.Number.exponentiate(-1, -Infinity), NaN, '-1 ** -∞ is NaN');

		t.equal(ES.Number.exponentiate(0.9, Infinity), 0, '0.9 ** +∞ is +0');
		t.equal(ES.Number.exponentiate(0.9, -Infinity), Infinity, '0.9 ** -∞ is ∞');
		t.equal(ES.Number.exponentiate(-0.9, Infinity), 0, '-0.9 ** +∞ is +0');
		t.equal(ES.Number.exponentiate(-0.9, -Infinity), Infinity, '-0.9 ** -∞ is +∞');

		forEach(v.numbers.concat(NaN), function (number) {
			t.equal(ES.Number.exponentiate(number, NaN), NaN, debug(number) + ' ** NaN is NaN');

			if (number !== 0) {
				t.equal(ES.Number.exponentiate(number, 0), 1, debug(number) + ' ** +0 is 1');
				t.equal(ES.Number.exponentiate(number, -0), 1, debug(number) + ' ** -0 is 1');
				t.equal(ES.Number.exponentiate(NaN, number), NaN, 'NaN ** ' + debug(number) + ' is NaN');
			}

			if (number !== 0 && isFinite(number)) {
				t.equal(ES.Number.equal(number, number), true, debug(number) + ' is equal to itself');
				t.equal(ES.Number.equal(number, number + 1), false, debug(number) + ' is not equal to itself plus 1');
			}
		});

		t.end();
	});

	test('Number::leftShift', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.leftShift(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.leftShift(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		forEach([0].concat(v.int32s), function (int32) {
			forEach([1, 3, 5, 31, 32, 33], function (bits) {
				t.equal(ES.Number.leftShift(int32, bits), int32 << bits, debug(int32) + ' << ' + bits + ' is ' + debug(int32 << bits));
			});
		});

		t.end();
	});

	test('Number::lessThan', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.lessThan(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.lessThan(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		t.equal(ES.Number.lessThan(+0, -0), false, '+0 < -0 is false');
		t.equal(ES.Number.lessThan(+0, +0), false, '+0 < +0 is false');
		t.equal(ES.Number.lessThan(-0, +0), false, '-0 < +0 is false');
		t.equal(ES.Number.lessThan(-0, -0), false, '-0 < -0 is false');

		t.equal(ES.Number.lessThan(NaN, NaN), undefined, 'NaN < NaN is undefined');

		t.equal(ES.Number.lessThan(+Infinity, +Infinity), false, '+∞ < +∞ is false');
		t.equal(ES.Number.lessThan(+Infinity, -Infinity), false, '+∞ < -∞ is false');
		t.equal(ES.Number.lessThan(-Infinity, +Infinity), true, '-∞ < +∞ is true');
		t.equal(ES.Number.lessThan(-Infinity, -Infinity), false, '-∞ < -∞ is false');

		forEach(v.numbers.concat(v.infinities), function (number) {
			t.equal(ES.Number.lessThan(NaN, number), undefined, 'NaN < ' + debug(number) + ' is undefined');
			t.equal(ES.Number.lessThan(number, NaN), undefined, debug(number) + ' < NaN is undefined');

			t.equal(ES.Number.lessThan(number, number), false, debug(number) + ' is not less than itself');

			if (isFinite(number)) {
				t.equal(ES.Number.lessThan(number, number + 1), true, debug(number) + ' < ' + debug(number + 1) + ' is true');
				t.equal(ES.Number.lessThan(number + 1, number), false, debug(number + 1) + ' < ' + debug(number) + ' is false');

				t.equal(ES.Number.lessThan(Infinity, number), false, '+∞ < ' + debug(number) + ' is false');
				t.equal(ES.Number.lessThan(number, Infinity), true, debug(number) + ' < +∞ is true');
				t.equal(ES.Number.lessThan(-Infinity, number), true, '-∞ < ' + debug(number) + ' is true');
				t.equal(ES.Number.lessThan(number, -Infinity), false, debug(number) + ' < -∞ is false');
			}
		});

		t.end();
	});

	test('Number::multiply', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.multiply(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.multiply(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		forEach([+0, -0, 1, -1], function (x) {
			var expected = x === 0 ? NaN : Infinity;
			t.equal(ES.Number.multiply(Infinity, x), expected, '+∞ * ' + debug(x) + ' is ' + debug(expected));
			t.equal(ES.Number.multiply(x, Infinity), expected, debug(x) + ' * +∞ is ' + debug(expected));
			t.equal(ES.Number.multiply(-Infinity, x), -expected, '-∞ * ' + debug(x) + ' is ' + debug(expected));
			t.equal(ES.Number.multiply(x, -Infinity), -expected, debug(x) + ' * -∞ is ' + debug(expected));
		});

		t.equal(ES.Number.multiply(Infinity, Infinity), Infinity, '+∞ * +∞ is +∞');
		t.equal(ES.Number.multiply(Infinity, -Infinity), -Infinity, '+∞ * -∞ is -∞');
		t.equal(ES.Number.multiply(-Infinity, Infinity), -Infinity, '-∞ * +∞ is -∞');
		t.equal(ES.Number.multiply(-Infinity, -Infinity), Infinity, '-∞ * -∞ is +∞');

		t.equal(ES.Number.multiply(+0, +0), +0, '0 * 0 is +0');
		t.equal(ES.Number.multiply(+0, -0), -0, '0 * -0 is -0');
		t.equal(ES.Number.multiply(-0, +0), -0, '-0 * 0 is -0');
		t.equal(ES.Number.multiply(-0, -0), +0, '-0 * -0 is +0');

		forEach(v.numbers.concat(NaN), function (number) {
			t.equal(ES.Number.multiply(NaN, number), NaN, 'NaN * ' + debug(number) + ' is NaN');
			t.equal(ES.Number.multiply(number, NaN), NaN, debug(number) + ' * NaN is NaN');

			if (number !== 0 && isFinite(number)) {
				t.equal(ES.Number.multiply(number, 0), number > 0 ? 0 : -0, debug(number) + ' * +0 produces ' + (number > 0 ? '+0' : '-0'));
				t.equal(ES.Number.multiply(0, number), number > 0 ? 0 : -0, '+0 * ' + debug(number) + ' produces ' + (number > 0 ? '+0' : '-0'));
				t.equal(ES.Number.multiply(number, -0), number > 0 ? -0 : 0, debug(number) + ' * -0 produces ' + (number > 0 ? '-0' : '+0'));
				t.equal(ES.Number.multiply(-0, number), number > 0 ? -0 : 0, '-0 * ' + debug(number) + ' produces ' + (number > 0 ? '-0' : '+0'));
				t.equal(ES.Number.multiply(number, 1), number, debug(number) + ' * 1 produces itself');
				t.equal(ES.Number.multiply(number, -42), number * -42, debug(number) + ' * -42 produces ' + (number - 42));
			}
		});

		t.end();
	});

	test('Number::remainder', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.remainder(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.remainder(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		t.equal(ES.Number.remainder(NaN, NaN), NaN, 'NaN % NaN is NaN');

		t.equal(ES.Number.remainder(+0, +0), NaN, '+0 % +0 is NaN');
		t.equal(ES.Number.remainder(+0, -0), NaN, '+0 % -0 is NaN');
		t.equal(ES.Number.remainder(-0, +0), NaN, '-0 % +0 is NaN');
		t.equal(ES.Number.remainder(-0, -0), NaN, '-0 % -0 is NaN');

		forEach(v.numbers, function (number) {
			t.equal(ES.Number.remainder(number, NaN), NaN, debug(number) + ' % NaN is NaN');
			t.equal(ES.Number.remainder(NaN, number), NaN, 'NaN % ' + debug(number) + ' is NaN');

			t.equal(ES.Number.remainder(Infinity, number), NaN, '+∞ % ' + debug(number) + ' is NaN');
			t.equal(ES.Number.remainder(-Infinity, number), NaN, '-∞ % ' + debug(number) + ' is NaN');
			t.equal(ES.Number.remainder(number, 0), NaN, debug(number) + ' % +0 is NaN');
			t.equal(ES.Number.remainder(number, -0), NaN, debug(number) + ' % -0 is NaN');

			if (isFinite(number)) {
				t.equal(ES.Number.remainder(number, Infinity), number, debug(number) + ' % +∞ is ' + debug(number));
				t.equal(ES.Number.remainder(number, -Infinity), number, debug(number) + ' % -∞ is ' + debug(number));
				if (number !== 0) {
					t.equal(ES.Number.remainder(0, number), 0, '+0 % ' + debug(number) + ' is ' + debug(number));
					t.equal(ES.Number.remainder(-0, number), -0, '-0 % ' + debug(number) + ' is ' + debug(number));
					t.looseEqual(ES.Number.remainder(number * 2, number), 0, debug(number) + ' % ' + debug(number * 2) + ' is 0');
				}
			}
		});

		t.end();
	});

	test('Number::sameValue', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.sameValue(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.sameValue(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		t.ok(ES.Number.sameValue(NaN, NaN), true, 'NaN is the sameValue as NaN');

		t.equal(ES.Number.sameValue(+0, +0), true, '+0 is sameValue as +0');
		t.equal(ES.Number.sameValue(+0, -0), false, '+0 is not sameValue as -0');
		t.equal(ES.Number.sameValue(-0, +0), false, '-0 is not sameValue as +0');
		t.equal(ES.Number.sameValue(-0, -0), true, '-0 is sameValue as -0');

		forEach(v.numbers, function (number) {
			t.ok(ES.Number.sameValue(number, number), debug(number) + ' is the sameValue as itself');
		});

		t.end();
	});

	test('Number::sameValueZero', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.sameValueZero(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.sameValueZero(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		t.ok(ES.Number.sameValueZero(NaN, NaN), true, 'NaN is the sameValueZero as NaN');

		t.equal(ES.Number.sameValueZero(+0, +0), true, '+0 is sameValueZero as +0');
		t.equal(ES.Number.sameValueZero(+0, -0), true, '+0 is sameValueZero as -0');
		t.equal(ES.Number.sameValueZero(-0, +0), true, '-0 is sameValueZero as +0');
		t.equal(ES.Number.sameValueZero(-0, -0), true, '-0 is sameValueZero as -0');

		forEach(v.numbers, function (number) {
			t.ok(ES.Number.sameValueZero(number, number), debug(number) + ' is the sameValueZero as itself');
		});

		t.end();
	});

	test('Number::signedRightShift', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.signedRightShift(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.signedRightShift(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		forEach([0].concat(v.int32s), function (int32) {
			forEach([1, 3, 5, 31, 32, 33], function (bits) {
				t.equal(ES.Number.signedRightShift(int32, bits), int32 >> bits, debug(int32) + ' >> ' + bits + ' is ' + debug(int32 >> bits));
			});
		});

		t.end();
	});

	test('Number::subtract', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.subtract(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.subtract(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		t.equal(ES.Number.subtract(+0, +0), +0, '0 - 0 is +0');
		t.equal(ES.Number.subtract(+0, -0), +0, '0 - -0 is +0');
		t.equal(ES.Number.subtract(-0, +0), -0, '-0 - 0 is -0');
		t.equal(ES.Number.subtract(-0, -0), +0, '-0 - -0 is +0');

		forEach(v.numbers, function (number) {
			if (number !== 0) {
				t.equal(ES.Number.subtract(number, 0), number, debug(number) + ' - 0 produces ' + number);
			}
			t.equal(ES.Number.subtract(number, 1), number - 1, debug(number) + ' - 1 produces ' + (number + 1));
			t.equal(ES.Number.subtract(number, 42), number - 42, debug(number) + ' - 42 produces ' + (number - 42));
		});

		t.end();
	});

	test('Number::toString', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.toString(nonNumber); },
				TypeError,
				debug(nonNumber) + ' is not a Number'
			);
		});

		forEach(v.numbers, function (number) {
			t.equal(ES.Number.toString(number), String(number), debug(number) + ' stringifies to ' + number);
		});

		t.end();
	});

	test('Number::unaryMinus', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.unaryMinus(nonNumber); },
				TypeError,
				debug(nonNumber) + ' is not a Number'
			);
		});

		t.equal(ES.Number.unaryMinus(NaN), NaN, 'NaN produces NaN');

		forEach(v.numbers, function (number) {
			t.equal(ES.Number.unaryMinus(number), -number, debug(number) + ' produces -' + debug(number));
		});

		t.end();
	});

	test('Number::unsignedRightShift', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.Number.unsignedRightShift(nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.Number.unsignedRightShift(0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		forEach([0].concat(v.int32s), function (int32) {
			forEach([1, 3, 5, 31, 32, 33], function (bits) {
				t.equal(ES.Number.unsignedRightShift(int32, bits), int32 >>> bits, debug(int32) + ' >>> ' + bits + ' is ' + debug(int32 >>> bits));
			});
		});

		t.end();
	});

	test('NumberToBigInt', function (t) {
		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.NumberToBigInt(nonNumber); },
				TypeError,
				debug(nonNumber) + ' is not a Number'
			);
		});

		forEach(v.nonIntegerNumbers, function (nonIntegerNumber) {
			t['throws'](
				function () { ES.NumberToBigInt(nonIntegerNumber); },
				RangeError,
				debug(nonIntegerNumber) + ' is not an integer'
			);
		});

		t.test('actual BigInts', { skip: !hasBigInts }, function (st) {
			forEach(v.integerNumbers, function (int) {
				if (int >= 1e17) {
					// BigInt(1e17) throws on node v10.4 - v10.8
					try {
						st.equal(ES.NumberToBigInt(int), $BigInt(int), debug(int) + ' becomes ' + debug($BigInt(int)));
					} catch (e) {
						st['throws'](
							function () { $BigInt(int); },
							RangeError,
							debug(int) + ' is too large on this engine to convert into a BigInt'
						);
					}
				} else {
					st.equal(ES.NumberToBigInt(int), $BigInt(int), debug(int) + ' becomes ' + debug($BigInt(int)));
				}
			});
			st.end();
		});

		t.end();
	});

	test('OrdinaryObjectCreate', function (t) {
		forEach(v.nonNullPrimitives, function (value) {
			t['throws'](
				function () { ES.OrdinaryObjectCreate(value); },
				TypeError,
				debug(value) + ' is not null, or an object'
			);
		});

		t.test('proto arg', function (st) {
			var Parent = function Parent() {};
			Parent.prototype.foo = {};
			var child = ES.OrdinaryObjectCreate(Parent.prototype);
			st.equal(child instanceof Parent, true, 'child is instanceof Parent');
			st.equal(child.foo, Parent.prototype.foo, 'child inherits properties from Parent.prototype');

			st.end();
		});

		t.test('internal slots arg', function (st) {
			st.doesNotThrow(function () { ES.OrdinaryObjectCreate({}, []); }, 'an empty slot list is valid');

			st['throws'](
				function () { ES.OrdinaryObjectCreate({}, ['a']); },
				SyntaxError,
				'internal slots are not supported'
			);

			st.end();
		});

		t.test('null proto', { skip: !$setProto }, function (st) {
			st.equal('toString' in {}, true, 'normal objects have toString');
			st.equal('toString' in ES.OrdinaryObjectCreate(null), false, 'makes a null object');

			st.end();
		});

		t.test('null proto when no native Object.create', { skip: $setProto }, function (st) {
			st['throws'](
				function () { ES.OrdinaryObjectCreate(null); },
				SyntaxError,
				'without a native Object.create, can not create null objects'
			);

			st.end();
		});

		t.end();
	});

	test('SameValueNonNumeric', function (t) {
		var willThrow = [
			[3, 4],
			[NaN, 4],
			[4, ''],
			['abc', true],
			[{}, false]
		];
		forEach(willThrow, function (nums) {
			t['throws'](function () { return ES.SameValueNonNumeric.apply(ES, nums); }, TypeError, 'value must be same type and non-number');
		});

		forEach(v.objects.concat(v.nonNumberPrimitives), function (val) {
			t.equal(val === val, ES.SameValueNonNumeric(val, val), debug(val) + ' is SameValueNonNumeric to itself');
		});

		t.end();
	});

	test('StringPad', function (t) {
		t.equal(ES.StringPad('a', 3, undefined, 'start'), '  a');
		t.equal(ES.StringPad('a', 3, undefined, 'end'), 'a  ');
		t.equal(ES.StringPad('a', 3, '0', 'start'), '00a');
		t.equal(ES.StringPad('a', 3, '0', 'end'), 'a00');
		t.equal(ES.StringPad('a', 3, '012', 'start'), '01a');
		t.equal(ES.StringPad('a', 3, '012', 'end'), 'a01');
		t.equal(ES.StringPad('a', 7, '012', 'start'), '012012a');
		t.equal(ES.StringPad('a', 7, '012', 'end'), 'a012012');

		t.end();
	});

	test('thisBigIntValue', { skip: !hasBigInts }, function (t) {
		t.equal(ES.thisBigIntValue(BigInt(42)), BigInt(42));
		t.equal(ES.thisBigIntValue(Object(BigInt(42))), BigInt(42));

		forEach(v.nonBigInts, function (nonBigInt) {
			t['throws'](
				function () { ES.thisBigIntValue(nonBigInt); },
				TypeError,
				debug(nonBigInt) + ' is not a BigInt'
			);
		});

		t.end();
	});

	test('ToInteger', function (t) {
		forEach([0, -0, NaN], function (num) {
			t.equal(0, ES.ToInteger(num), debug(num) + ' returns +0');
		});
		forEach([Infinity, 42], function (num) {
			t.equal(num, ES.ToInteger(num), debug(num) + ' returns itself');
			t.equal(-num, ES.ToInteger(-num), '-' + debug(num) + ' returns itself');
		});
		t.equal(3, ES.ToInteger(Math.PI), 'pi returns 3');
		t['throws'](function () { return ES.ToInteger(v.uncoercibleObject); }, TypeError, 'uncoercibleObject throws');
		t.end();
	});

	test('UTF16DecodeSurrogatePair', function (t) {
		t['throws'](
			function () { ES.UTF16DecodeSurrogatePair('a'.charCodeAt(0), trailingPoo.charCodeAt(0)); },
			TypeError,
			'"a" is not a leading surrogate'
		);
		t['throws'](
			function () { ES.UTF16DecodeSurrogatePair(leadingPoo.charCodeAt(0), 'b'.charCodeAt(0)); },
			TypeError,
			'"b" is not a trailing surrogate'
		);

		t.equal(ES.UTF16DecodeSurrogatePair(leadingPoo.charCodeAt(0), trailingPoo.charCodeAt(0)), wholePoo);

		t.end();
	});

	test('NumberBitwiseOp', function (t) {
		t['throws'](
			function () { ES.NumberBitwiseOp('invalid', 0, 0); },
			TypeError,
			'throws with an invalid op'
		);

		forEach(v.nonNumbers, function (nonNumber) {
			t['throws'](
				function () { ES.NumberBitwiseOp('&', nonNumber, 0); },
				TypeError,
				'x: ' + debug(nonNumber) + ' is not a Number'
			);
			t['throws'](
				function () { ES.NumberBitwiseOp('&', 0, nonNumber); },
				TypeError,
				'y: ' + debug(nonNumber) + ' is not a Number'
			);
		});

		t.equal(ES.NumberBitwiseOp('&', 1, 2), 1 & 2);
		t.equal(ES.NumberBitwiseOp('|', 1, 2), 1 | 2);
		t.equal(ES.NumberBitwiseOp('^', 1, 2), 1 ^ 2);

		t.end();
	});

	test('ToNumeric', function (t) {
		testToNumber(t, ES, ES.ToNumeric);

		t.test('BigInts', { skip: !hasBigInts }, function (st) {
			st.equal(ES.ToNumeric(BigInt(42)), BigInt(42), debug(BigInt(42)) + ' is ' + debug(BigInt(42)));
			st.equal(ES.ToNumeric(Object(BigInt(42))), BigInt(42), debug(Object(BigInt(42))) + ' is ' + debug(BigInt(42)));

			var valueOf = { valueOf: function () { return BigInt(7); } };
			st.equal(ES.ToNumeric(valueOf), valueOf.valueOf(), debug(valueOf) + ' is ' + debug(valueOf.valueOf()));

			var toPrimitive = {};
			var value = BigInt(-2);
			toPrimitive[Symbol.toPrimitive] = function () { return value; };
			st.equal(ES.ToNumeric(toPrimitive), value, debug(toPrimitive) + ' is ' + debug(value));

			st.end();
		});

		t.end();
	});

	test('UTF16DecodeString', function (t) {
		forEach(v.nonStrings, function (nonString) {
			t['throws'](
				function () { ES.UTF16DecodeString(nonString); },
				TypeError,
				debug(nonString) + ' is not a String'
			);
		});

		t.deepEqual(ES.UTF16DecodeString('abc'), ['a', 'b', 'c'], 'code units get split');
		t.deepEqual(ES.UTF16DecodeString('a' + wholePoo + 'c'), ['a', wholePoo, 'c'], 'code points get split too');

		t.end();
	});
};

module.exports = {
	es5: es5,
	es2015: es2015,
	es2016: es2016,
	es2017: es2017,
	es2018: es2018,
	es2019: es2019,
	es2020: es2020
};
