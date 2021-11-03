'use strict';

/**
 * Check whether a at-rule is standard
 *
 * @param {import('postcss').AtRule | import('postcss-less').AtRule} atRule postcss at-rule node
 * @return {boolean} If `true`, the declaration is standard
 */
module.exports = function (atRule) {
	// Ignore scss `@content` inside mixins
	if (!atRule.nodes && atRule.params === '') {
		return false;
	}

	// Ignore Less mixins
	if ('mixin' in atRule && atRule.mixin) {
		return false;
	}

	// Ignore Less detached ruleset `@detached-ruleset: { background: red; }; .top { @detached-ruleset(); }`
	if (
		('variable' in atRule && atRule.variable) ||
		(!atRule.nodes && atRule.raws.afterName === '' && atRule.params[0] === '(')
	) {
		return false;
	}

	return true;
};
