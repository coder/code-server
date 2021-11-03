'use strict';
const isUtf8 = require('is-utf8');

module.exports = x => {
	if (!Buffer.isBuffer(x)) {
		throw new TypeError('Expected a Buffer, got ' + typeof x);
	}

	if (x[0] === 0xEF && x[1] === 0xBB && x[2] === 0xBF && isUtf8(x)) {
		return x.slice(3);
	}

	return x;
};
