'use strict';

const selectorParser = require('postcss-selector-parser');

/**
 * @param {string} selector
 * @param {import('stylelint').PostcssResult} result
 * @param {import('postcss').Node} node
 * @param {Function} cb
 */
module.exports = function parseSelector(selector, result, node, cb) {
	try {
		// @ts-ignore TODO TYPES wrong postcss-selector-parser types
		return selectorParser(cb).processSync(selector);
	} catch {
		result.warn('Cannot parse selector', { node, stylelintType: 'parseError' });
	}
};
