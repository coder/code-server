// @ts-nocheck

'use strict';

const _ = require('lodash');
const isStandardSyntaxAtRule = require('../../utils/isStandardSyntaxAtRule');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const vendor = require('../../utils/vendor');

const ruleName = 'at-rule-disallowed-list';

const messages = ruleMessages(ruleName, {
	rejected: (name) => `Unexpected at-rule "${name}"`,
});

function rule(listInput) {
	// To allow for just a string as a parameter (not only arrays of strings)
	const list = [].concat(listInput);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: list,
			possible: [_.isString],
		});

		if (!validOptions) {
			return;
		}

		root.walkAtRules((atRule) => {
			const name = atRule.name;

			if (!isStandardSyntaxAtRule(atRule)) {
				return;
			}

			if (!list.includes(vendor.unprefixed(name).toLowerCase())) {
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

rule.primaryOptionArray = true;

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
