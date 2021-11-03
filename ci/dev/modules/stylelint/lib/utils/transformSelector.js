'use strict';

const selectorParser = require('postcss-selector-parser');

/**
 * @param {import('stylelint').PostcssResult} result
 * @param {import('postcss').Node} node
 * @param {Function} cb
 */
module.exports = function (result, node, cb) {
	try {
		// @ts-ignore TODO TYPES wrong postcss-selector-parser definitions
		return selectorParser(cb).processSync(node, { updateSelector: true });
	} catch {
		result.warn('Cannot parse selector', { node, stylelintType: 'parseError' });
	}
};
