// @ts-nocheck

'use strict';

const _ = require('lodash');
const isStandardSyntaxAtRule = require('../../utils/isStandardSyntaxAtRule');
const keywordSets = require('../../reference/keywordSets');
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const vendor = require('../../utils/vendor');

const ruleName = 'at-rule-no-unknown';

const messages = ruleMessages(ruleName, {
	rejected: (atRule) => `Unexpected unknown at-rule "${atRule}"`,
});

function rule(actual, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{ actual },
			{
				actual: options,
				possible: {
					ignoreAtRules: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkAtRules((atRule) => {
			if (!isStandardSyntaxAtRule(atRule)) {
				return;
			}

			const name = atRule.name;

			// Return early if at-rule is to be ignored
			if (optionsMatches(options, 'ignoreAtRules', atRule.name)) {
				return;
			}

			if (vendor.prefix(name) || keywordSets.atRules.has(name.toLowerCase())) {
				return;
			}

			report({
				message: messages.rejected(`@${name}`),
				node: atRule,
				ruleName,
				result,
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
