// @ts-nocheck

'use strict';

const beforeBlockString = require('../../utils/beforeBlockString');
const blockString = require('../../utils/blockString');
const hasBlock = require('../../utils/hasBlock');
const hasEmptyBlock = require('../../utils/hasEmptyBlock');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'block-opening-brace-space-after';

const messages = ruleMessages(ruleName, {
	expectedAfter: () => 'Expected single space after "{"',
	rejectedAfter: () => 'Unexpected whitespace after "{"',
	expectedAfterSingleLine: () => 'Expected single space after "{" of a single-line block',
	rejectedAfterSingleLine: () => 'Unexpected whitespace after "{" of a single-line block',
	expectedAfterMultiLine: () => 'Expected single space after "{" of a multi-line block',
	rejectedAfterMultiLine: () => 'Unexpected whitespace after "{" of a multi-line block',
});

function rule(expectation, options, context) {
	const checker = whitespaceChecker('space', expectation, messages);

	return (root, result) => {
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
			// Return early if blockless or has an empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) {
				return;
			}

			checker.after({
				source: blockString(statement),
				index: 0,
				err: (m) => {
					if (context.fix) {
						if (expectation.startsWith('always')) {
							statement.first.raws.before = ' ';

							return;
						}

						if (expectation.startsWith('never')) {
							statement.first.raws.before = '';

							return;
						}
					}

					report({
						message: m,
						node: statement,
						index: beforeBlockString(statement, { noRawBefore: true }).length + 1,
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
