'use strict';

const normalizeRuleSettings = require('../normalizeRuleSettings');
const Result = require('postcss/lib/result');
const rules = require('../rules');

/**
 * Useful for third-party code (e.g. plugins) to run a PostCSS Root
 * against a specific rule and do something with the warnings
 * @template T
 * @template {Object} O
 * @param {{
		ruleName: string,
		ruleSettings: import('stylelint').StylelintConfigRuleSettings<T, O>,
		root: import('postcss').Root,
	}} options
 * @param {Function} callback
 * @returns {void}
 */
module.exports = function (options, callback) {
	if (!options)
		throw new Error(
			"checkAgainstRule requires an options object with 'ruleName', 'ruleSettings', and 'root' properties",
		);

	if (!callback) throw new Error('checkAgainstRule requires a callback');

	if (!options.ruleName) throw new Error("checkAgainstRule requires a 'ruleName' option");

	if (!Object.keys(rules).includes(options.ruleName))
		throw new Error(`Rule '${options.ruleName}' does not exist`);

	if (!options.ruleSettings) throw new Error("checkAgainstRule requires a 'ruleSettings' option");

	if (!options.root) throw new Error("checkAgainstRule requires a 'root' option");

	const settings = normalizeRuleSettings(options.ruleSettings, options.ruleName);

	if (!settings) {
		return;
	}

	// @ts-expect-error - this error should not occur with PostCSS 8
	const tmpPostcssResult = new Result();

	rules[options.ruleName](
		settings[0],
		/** @type {O} */ (settings[1]),
		{},
	)(options.root, tmpPostcssResult);
	tmpPostcssResult.warnings().forEach(callback);
};
