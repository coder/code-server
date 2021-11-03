'use strict';

var GetIntrinsic = require('get-intrinsic');

var originalSetProto = GetIntrinsic('%Object.setPrototypeOf%', true);
var $ArrayProto = GetIntrinsic('%Array.prototype%');

module.exports = originalSetProto || (
	// eslint-disable-next-line no-proto, no-negated-condition
	[].__proto__ !== $ArrayProto
		? null
		: function (O, proto) {
			O.__proto__ = proto; // eslint-disable-line no-proto, no-param-reassign
			return O;
		}
);
