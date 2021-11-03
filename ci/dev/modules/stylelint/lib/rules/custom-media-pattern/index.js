// @ts-nocheck

'use strict';

const _ = require('lodash');
const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'custom-media-pattern';

const messages = ruleMessages(ruleName, {
	expected: (pattern) => `Expected custom media query name to match pattern "${pattern}"`,
});

function rule(pattern) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: pattern,
			possible: [_.isRegExp, _.isString],
		});

		if (!validOptions) {
			return;
		}

		const regexpPattern = _.isString(pattern) ? new RegExp(pattern) : pattern;

		root.walkAtRules((atRule) => {
			if (atRule.name.toLowerCase() !== 'custom-media') {
				return;
			}

			const customMediaName = atRule.params.match(/^--(\S+)\b/)[1];

			if (regexpPattern.test(customMediaName)) {
				return;
			}

			report({
				message: messages.expected(pattern),
				node: atRule,
				index: atRuleParamIndex(atRule),
				result,
				ruleName,
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
