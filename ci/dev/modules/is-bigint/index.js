'use strict';

if (typeof BigInt === 'function') {
	var bigIntValueOf = BigInt.prototype.valueOf;
	var tryBigInt = function tryBigIntObject(value) {
		try {
			bigIntValueOf.call(value);
			return true;
		} catch (e) {
		}
		return false;
	};

	module.exports = function isBigInt(value) {
		if (
			value === null
			|| typeof value === 'undefined'
			|| typeof value === 'boolean'
			|| typeof value === 'string'
			|| typeof value === 'number'
			|| typeof value === 'symbol'
			|| typeof value === 'function'
		) {
			return false;
		}
		if (typeof value === 'bigint') {
			return true;
		}

		return tryBigInt(value);
	};
} else {
	module.exports = function isBigInt(value) {
		return false && value;
	};
}
