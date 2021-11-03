'use strict';

const beforeBlockString = require('./beforeBlockString');
const hasBlock = require('./hasBlock');
const rawNodeString = require('./rawNodeString');

/** @typedef {import('postcss').Rule} Rule */
/** @typedef {import('postcss').AtRule} AtRule */

/**
 * Return a CSS statement's block -- the string that starts and `{` and ends with `}`.
 *
 * If the statement has no block (e.g. `@import url(foo.css);`),
 * return false.
 *
 * @param {Rule | AtRule} statement - postcss rule or at-rule node
 * @return {string | boolean}
 */
module.exports = function (statement) {
	if (!hasBlock(statement)) {
		return false;
	}

	return rawNodeString(statement).slice(beforeBlockString(statement).length);
};
