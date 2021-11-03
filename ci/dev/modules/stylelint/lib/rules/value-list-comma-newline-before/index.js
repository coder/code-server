// @ts-nocheck

'use strict';

const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueListCommaWhitespaceChecker = require('../valueListCommaWhitespaceChecker');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'value-list-comma-newline-before';

const messages = ruleMessages(ruleName, {
	expectedBefore: () => 'Expected newline before ","',
	expectedBeforeMultiLine: () => 'Expected newline before "," in a multi-line list',
	rejectedBeforeMultiLine: () => 'Unexpected whitespace before "," in a multi-line list',
});

function rule(expectation) {
	const checker = whitespaceChecker('newline', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'always-multi-line', 'never-multi-line'],
		});

		if (!validOptions) {
			return;
		}

		valueListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.beforeAllowingIndentation,
			checkedRuleName: ruleName,
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
