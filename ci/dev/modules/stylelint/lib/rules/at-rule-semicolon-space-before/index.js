// @ts-nocheck

'use strict';

const hasBlock = require('../../utils/hasBlock');
const isStandardSyntaxAtRule = require('../../utils/isStandardSyntaxAtRule');
const rawNodeString = require('../../utils/rawNodeString');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'at-rule-semicolon-space-before';

const messages = ruleMessages(ruleName, {
	expectedBefore: () => 'Expected single space before ";"',
	rejectedBefore: () => 'Unexpected whitespace before ";"',
});

function rule(expectation) {
	const checker = whitespaceChecker('space', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never'],
		});

		if (!validOptions) {
			return;
		}

		root.walkAtRules((atRule) => {
			if (hasBlock(atRule)) {
				return;
			}

			if (!isStandardSyntaxAtRule(atRule)) {
				return;
			}

			const nodeString = rawNodeString(atRule);

			checker.before({
				source: nodeString,
				index: nodeString.length,
				err: (m) => {
					report({
						message: m,
						node: atRule,
						index: nodeString.length - 1,
						result,
						ruleName,
					});
				},
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
