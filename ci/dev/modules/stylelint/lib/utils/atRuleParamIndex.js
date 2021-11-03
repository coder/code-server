'use strict';

/**
 * @param {import('postcss').AtRule} atRule
 * @returns {number}
 */
module.exports = function (atRule) {
	// Initial 1 is for the `@`
	let index = 1 + atRule.name.length;

	if (atRule.raws.afterName) {
		index += atRule.raws.afterName.length;
	}

	return index;
};
