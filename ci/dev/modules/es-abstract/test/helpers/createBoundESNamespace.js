'use strict';

var bind = require('function-bind');

var OwnPropertyKeys = require('../../helpers/OwnPropertyKeys');

module.exports = function createBoundESNamespace(ES) {
	var keys = OwnPropertyKeys(ES);
	var result = {};

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var prop = ES[key];
		if (typeof prop === 'function') {
			prop = bind.call(prop, undefined);
		} else if (prop && typeof prop === 'object') {
			prop = createBoundESNamespace(prop);
		}
		result[key] = prop;
	}

	return result;
};
