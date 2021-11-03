'use strict';

var test = require('tape');
var hasSymbols = require('has-symbols')();

var OwnPropertyKeys = require('../../helpers/OwnPropertyKeys');
var defineProperty = require('./defineProperty');

test('OwnPropertyKeys', function (t) {
	t.deepEqual(OwnPropertyKeys({ a: 1, b: 2 }).sort(), ['a', 'b'].sort(), 'returns own string keys');

	t.test('Symbols', { skip: !hasSymbols }, function (st) {
		var o = { a: 1 };
		var sym = Symbol();
		o[sym] = 2;

		st.deepEqual(OwnPropertyKeys(o), ['a', sym], 'returns own string and symbol keys');

		st.end();
	});

	t.test('non-enumerables', { skip: !defineProperty.oDP }, function (st) {
		var o = { a: 1, b: 42, c: NaN };
		defineProperty(o, 'b', { enumerable: false, value: 42 });
		defineProperty(o, 'c', { enumerable: false, get: function () { return NaN; } });

		if (hasSymbols) {
			defineProperty(o, 'd', { enumerable: false, value: true });
			defineProperty(o, 'e', { enumerable: false, get: function () { return true; } });
		}

		st.deepEqual(
			OwnPropertyKeys(o).sort(),
			(hasSymbols ? ['a', 'b', 'c', 'd', 'e'] : ['a', 'b', 'c']).sort(),
			'returns non-enumerable own keys, including accessors and symbols if available'
		);

		st.end();
	});

	t.end();
});
