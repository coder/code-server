'use strict';
var mapObj = require('map-obj');
var decamelize = require('decamelize');

module.exports = function (input, separator, options) {
	if (typeof separator !== 'string') {
		options = separator;
		separator = null;
	}

	options = options || {};
	separator = separator || options.separator;
	var exclude = options.exclude || [];

	return mapObj(input, function (key, val) {
		key = exclude.indexOf(key) === -1 ? decamelize(key, separator) : key;
		return [key, val];
	});
};
