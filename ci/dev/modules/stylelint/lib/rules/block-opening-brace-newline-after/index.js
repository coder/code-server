// @ts-nocheck

'use strict';

const beforeBlockString = require('../../utils/beforeBlockString');
const blockString = require('../../utils/blockString');
const hasBlock = require('../../utils/hasBlock');
const hasEmptyBlock = require('../../utils/hasEmptyBlock');
const rawNodeString = require('../../utils/rawNodeString');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'block-opening-brace-newline-after';

const messages = ruleMessages(ruleName, {
	expectedAfter: () => 'Expected newline after "{"',
	expectedAfterMultiLine: () => 'Expected newline after "{" of a multi-line block',
	rejectedAfterMultiLine: () => 'Unexpected whitespace after "{" of a multi-line block',
});

function rule(expectation, options, context) {
	const checker = whitespaceChecker('newline', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'always-multi-line', 'never-multi-line'],
		});

		if (!validOptions) {
			return;
		}

		// Check both kinds of statement: rules and at-rules
		root.walkRules(check);
		root.walkAtRules(check);

		function check(statement) {
			// Return early if blockless or has an empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) {
				return;
			}

			const backupCommentNextBefores = new Map();

			// next node with checking newlines after comment
			function nextNode(startNode) {
				if (!startNode || !startNode.next) return null;

				if (startNode.type === 'comment') {
					const reNewLine = /\r?\n/;
					const newLineMatch = reNewLine.test(startNode.raws.before);

					const next = startNode.next();

					if (next && newLineMatch && !reNewLine.test(next.raws.before)) {
						backupCommentNextBefores.set(next, next.raws.before);
						next.raws.before = startNode.raws.before;
					}

					return nextNode(next);
				}

				return startNode;
			}

			// Allow an end-of-line comment
			const nodeToCheck = nextNode(statement.first);

			if (!nodeToCheck) {
				return;
			}

			checker.afterOneOnly({
				source: rawNodeString(nodeToCheck),
				index: -1,
				lineCheckStr: blockString(statement),
				err: (m) => {
					if (context.fix) {
						if (expectation.startsWith('always')) {
							const index = nodeToCheck.raws.before.search(/\r?\n/);

							if (index >= 0) {
								nodeToCheck.raws.before = nodeToCheck.raws.before.slice(index);
							} else {
								nodeToCheck.raws.before = context.newline + nodeToCheck.raws.before;
							}

							backupCommentNextBefores.delete(nodeToCheck);

							return;
						}

						if (expectation === 'never-multi-line') {
							// Restore the `before` of the node next to the comment node.
							backupCommentNextBefores.forEach((before, node) => {
								node.raws.before = before;
							});
							backupCommentNextBefores.clear();

							// Fix
							const reNewLine = /\r?\n/;
							let fixTarget = statement.first;

							while (fixTarget) {
								if (reNewLine.test(fixTarget.raws.before)) {
									fixTarget.raws.before = fixTarget.raws.before.replace(/\r?\n/g, '');
								}

								if (fixTarget.type !== 'comment') {
									break;
								}

								fixTarget = fixTarget.next();
							}

							nodeToCheck.raws.before = '';

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

			// Restore the `before` of the node next to the comment node.
			backupCommentNextBefores.forEach((before, node) => {
				node.raws.before = before;
			});
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
