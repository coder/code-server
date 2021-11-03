'use strict';

const _ = require('lodash');

/** @typedef {import('postcss').Declaration} Declaration */

/**
 * @param {Declaration} decl
 * @param {string} value
 * @returns {Declaration} The declaration that was passed in.
 */
module.exports = function setDeclarationValue(decl, value) {
	// Lodash is necessary here because the declaration may not strictly adhere
	// to the current version of PostCSS's Declaration interface.
	// See also: https://github.com/stylelint/stylelint/pull/5183/files#r588047494
	if (_.has(decl, 'raws.value')) {
		_.set(decl, 'raws.value.raw', value);
	} else {
		decl.value = value;
	}

	return decl;
};
