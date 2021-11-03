'use strict';

/**
 * Check if a statement has an block (empty or otherwise).
 *
 * @param {import('postcss').Rule | import('postcss').AtRule} statement - postcss rule or at-rule node
 * @return {boolean} True if `statement` has a block (empty or otherwise)
 */
module.exports = function (statement) {
	return statement.nodes !== undefined;
};
