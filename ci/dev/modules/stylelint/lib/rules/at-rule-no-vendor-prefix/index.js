// @ts-nocheck

'use strict';

const isAutoprefixable = require('../../utils/isAutoprefixable');
const isStandardSyntaxAtRule = require('../../utils/isStandardSyntaxAtRule');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'at-rule-no-vendor-prefix';

const messages = ruleMessages(ruleName, {
	rejected: (p) => `Unexpected vendor-prefixed at-rule "@${p}"`,
});

function rule(actual, options, context) {
	return function (root, result) {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		root.walkAtRules((atRule) => {
			if (!isStandardSyntaxAtRule(atRule)) {
				return;
			}

			const name = atRule.name;

			if (!name.startsWith('-')) {
				return;
			}

			if (!isAutoprefixable.atRuleName(name)) {
				return;
			}

			if (context.fix) {
				atRule.name = isAutoprefixable.unprefix(atRule.name);

				return;
			}

			report({
				message: messages.rejected(name),
				node: atRule,
				result,
				ruleName,
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
