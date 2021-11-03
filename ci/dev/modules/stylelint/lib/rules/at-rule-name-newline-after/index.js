// @ts-nocheck

'use strict';

const atRuleNameSpaceChecker = require('../atRuleNameSpaceChecker');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'at-rule-name-newline-after';

const messages = ruleMessages(ruleName, {
	expectedAfter: (name) => `Expected newline after at-rule name "${name}"`,
});

function rule(expectation) {
	const checker = whitespaceChecker('newline', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'always-multi-line'],
		});

		if (!validOptions) {
			return;
		}

		atRuleNameSpaceChecker({
			root,
			result,
			locationChecker: checker.afterOneOnly,
			checkedRuleName: ruleName,
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
