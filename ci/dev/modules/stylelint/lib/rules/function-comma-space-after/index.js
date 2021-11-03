// @ts-nocheck

'use strict';

const fixer = require('../functionCommaSpaceFix');
const functionCommaSpaceChecker = require('../functionCommaSpaceChecker');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'function-comma-space-after';

const messages = ruleMessages(ruleName, {
	expectedAfter: () => 'Expected single space after ","',
	rejectedAfter: () => 'Unexpected whitespace after ","',
	expectedAfterSingleLine: () => 'Expected single space after "," in a single-line function',
	rejectedAfterSingleLine: () => 'Unexpected whitespace after "," in a single-line function',
});

function rule(expectation, options, context) {
	const checker = whitespaceChecker('space', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never', 'always-single-line', 'never-single-line'],
		});

		if (!validOptions) {
			return;
		}

		functionCommaSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: context.fix
				? (div, index, nodes) => {
						return fixer({
							div,
							index,
							nodes,
							expectation,
							position: 'after',
							symb: ' ',
						});
				  }
				: null,
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
