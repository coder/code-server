'use strict';

var keys = require('object-keys');
var forEach = require('foreach');
var indexOf = require('array.prototype.indexof');
var has = require('has');

module.exports = function diffOperations(actual, expected, expectedMissing) {
	var actualKeys = keys(actual);
	var expectedKeys = keys(expected);

	var extra = [];
	var missing = [];
	var extraMissing = [];

	forEach(actualKeys, function (op) {
		if (!(op in expected)) {
			if (actual[op] && typeof actual[op] === 'object') {
				forEach(keys(actual[op]), function (nestedOp) {
					var fullNestedOp = op + '::' + nestedOp;
					if (!(fullNestedOp in expected)) {
						extra.push(fullNestedOp);
					} else if (indexOf(expectedMissing, fullNestedOp) !== -1) {
						extra.push(fullNestedOp);
					}
				});
			} else {
				extra.push(op);
			}
		} else if (indexOf(expectedMissing, op) !== -1) {
			extra.push(op);
		}
	});
	var checkMissing = function checkMissing(op, actualValue) {
		if (typeof actualValue !== 'function' && indexOf(expectedMissing, op) === -1) {
			missing.push(op);
		}
	};
	forEach(expectedKeys, function (op) {
		if (op.indexOf('::') > -1) {
			var parts = op.split('::');
			var value = actual[parts[0]];
			if (value && typeof value === 'object' && typeof value[parts[1]] === 'function') {
				checkMissing(op, value[parts[1]]);
			}
		} else {
			checkMissing(op, actual[op]);
		}
	});

	forEach(expectedMissing, function (expectedOp) {
		if (!has(expected, expectedOp)) {
			extraMissing.push(expectedOp);
		}
	});

	return { missing: missing, extra: extra, extraMissing: extraMissing };
};
