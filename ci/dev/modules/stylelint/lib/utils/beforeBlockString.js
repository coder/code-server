'use strict';

/** @typedef {import('postcss').Rule} Rule */
/** @typedef {import('postcss').AtRule} AtRule */

/**
 * @param {Rule | AtRule} statement
 * @param {{
 * 	noRawBefore?: boolean
 * }} options
 *
 * @returns {string}
 */
module.exports = function (statement, options = {}) {
	let result = '';
	/** @type {Rule | undefined} */
	let rule; /*?: postcss$rule*/
	/** @type {AtRule | undefined} */
	let atRule; /*?: postcss$atRule*/

	if (statement.type === 'rule') {
		rule = statement;
	}

	if (statement.type === 'atrule') {
		atRule = statement;
	}

	if (!rule && !atRule) {
		return result;
	}

	const before = statement.raws.before || '';

	if (!options.noRawBefore) {
		result += before;
	}

	if (rule) {
		result += rule.selector;
	}

	if (atRule) {
		result += `@${atRule.name}${atRule.raws.afterName || ''}${atRule.params}`;
	}

	const between = statement.raws.between;

	if (between !== undefined) {
		result += between;
	}

	return result;
};
