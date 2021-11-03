// @ts-nocheck

'use strict';

const blockString = require('../../utils/blockString');
const hasBlock = require('../../utils/hasBlock');
const rawNodeString = require('../../utils/rawNodeString');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'block-closing-brace-space-after';

const messages = ruleMessages(ruleName, {
	expectedAfter: () => 'Expected single space after "}"',
	rejectedAfter: () => 'Unexpected whitespace after "}"',
	expectedAfterSingleLine: () => 'Expected single space after "}" of a single-line block',
	rejectedAfterSingleLine: () => 'Unexpected whitespace after "}" of a single-line block',
	expectedAfterMultiLine: () => 'Expected single space after "}" of a multi-line block',
	rejectedAfterMultiLine: () => 'Unexpected whitespace after "}" of a multi-line block',
});

function rule(expectation) {
	const checker = whitespaceChecker('space', expectation, messages);

	return function (root, result) {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: [
				'always',
				'never',
				'always-single-line',
				'never-single-line',
				'always-multi-line',
				'never-multi-line',
			],
		});

		if (!validOptions) {
			return;
		}

		// Check both kinds of statements: rules and at-rules
		root.walkRules(check);
		root.walkAtRules(check);

		function check(statement) {
			const nextNode = statement.next();

			if (!nextNode) {
				return;
			}

			if (!hasBlock(statement)) {
				return;
			}

			let reportIndex = statement.toString().length;
			let source = rawNodeString(nextNode);

			// Skip a semicolon at the beginning, if any
			if (source && source.startsWith(';')) {
				source = source.slice(1);
				reportIndex++;
			}

			checker.after({
				source,
				index: -1,
				lineCheckStr: blockString(statement),
				err: (msg) => {
					report({
						message: msg,
						node: statement,
						index: reportIndex,
						result,
						ruleName,
					});
				},
			});
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
