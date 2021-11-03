'use strict';
const isRegexp = require('is-regexp');

const flagMap = {
	global: 'g',
	ignoreCase: 'i',
	multiline: 'm',
	dotAll: 's',
	sticky: 'y',
	unicode: 'u'
};

module.exports = (regexp, options = {}) => {
	if (!isRegexp(regexp)) {
		throw new TypeError('Expected a RegExp instance');
	}

	const flags = Object.keys(flagMap).map(flag => (
		(typeof options[flag] === 'boolean' ? options[flag] : regexp[flag]) ? flagMap[flag] : ''
	)).join('');

	const clonedRegexp = new RegExp(options.source || regexp.source, flags);

	clonedRegexp.lastIndex = typeof options.lastIndex === 'number' ?
		options.lastIndex :
		regexp.lastIndex;

	return clonedRegexp;
};
