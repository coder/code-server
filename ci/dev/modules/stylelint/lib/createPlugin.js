'use strict';

/** @typedef {import('stylelint').StylelintRule} StylelintRule */

/**
 * @param {string} ruleName
 * @param {StylelintRule} rule
 * @returns {{ruleName: string, rule: StylelintRule}}
 */
module.exports = function (ruleName, rule) {
	return {
		ruleName,
		rule,
	};
};
