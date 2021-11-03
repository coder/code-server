'use strict';

/**
 * Check whether a function is standard
 *
 * @param {import('postcss-value-parser').Node} node
 * @returns {boolean}
 */
module.exports = function (node) {
	// Function nodes without names are things in parentheses like Sass lists
	if (!node.value) {
		return false;
	}

	return true;
};
