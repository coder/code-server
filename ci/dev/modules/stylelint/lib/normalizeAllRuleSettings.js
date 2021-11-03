'use strict';

const _ = require('lodash');
const normalizeRuleSettings = require('./normalizeRuleSettings');
const rules = require('./rules');

/** @typedef {import('stylelint').StylelintConfigRules} StylelintConfigRules */
/** @typedef {import('stylelint').StylelintConfig} StylelintConfig */

/**
 * @param {StylelintConfig} config
 * @return {StylelintConfig}
 */
function normalizeAllRuleSettings(config) {
	/** @type {StylelintConfigRules} */
	const normalizedRules = {};

	if (!config.rules) return config;

	Object.keys(config.rules).forEach((ruleName) => {
		const rawRuleSettings = _.get(config, ['rules', ruleName]);

		const rule = rules[ruleName] || _.get(config, ['pluginFunctions', ruleName]);

		if (!rule) {
			normalizedRules[ruleName] = [];
		} else {
			normalizedRules[ruleName] = normalizeRuleSettings(
				rawRuleSettings,
				ruleName,
				_.get(rule, 'primaryOptionArray'),
			);
		}
	});

	config.rules = normalizedRules;

	return config;
}

module.exports = normalizeAllRuleSettings;
