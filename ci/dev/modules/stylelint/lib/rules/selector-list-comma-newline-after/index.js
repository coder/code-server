// @ts-nocheck

'use strict';

const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const styleSearch = require('style-search');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'selector-list-comma-newline-after';

const messages = ruleMessages(ruleName, {
	expectedAfter: () => 'Expected newline after ","',
	expectedAfterMultiLine: () => 'Expected newline after "," in a multi-line list',
	rejectedAfterMultiLine: () => 'Unexpected whitespace after "," in a multi-line list',
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

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			// Get raw selector so we can allow end-of-line comments, e.g.
			// a, /* comment */
			// b {}
			const selector = ruleNode.raws.selector ? ruleNode.raws.selector.raw : ruleNode.selector;

			const fixIndices = [];

			styleSearch(
				{
					source: selector,
					target: ',',
					functionArguments: 'skip',
				},
				(match) => {
					const nextChars = selector.substr(match.endIndex, selector.length - match.endIndex);

					// If there's a // comment, that means there has to be a newline
					// ending the comment so we're fine
					if (/^\s+\/\//.test(nextChars)) {
						return;
					}

					// If there are spaces and then a comment begins, look for the newline
					const indextoCheckAfter = /^\s+\/\*/.test(nextChars)
						? selector.indexOf('*/', match.endIndex) + 1
						: match.startIndex;

					checker.afterOneOnly({
						source: selector,
						index: indextoCheckAfter,
						err: (m) => {
							if (context.fix) {
								fixIndices.push(indextoCheckAfter + 1);

								return;
							}

							report({
								message: m,
								node: ruleNode,
								index: match.startIndex,
								result,
								ruleName,
							});
						},
					});
				},
			);

			if (fixIndices.length) {
				let fixedSelector = selector;

				fixIndices
					.sort((a, b) => b - a)
					.forEach((index) => {
						const beforeSelector = fixedSelector.slice(0, index);
						let afterSelector = fixedSelector.slice(index);

						if (expectation.startsWith('always')) {
							afterSelector = context.newline + afterSelector;
						} else if (expectation.startsWith('never-multi-line')) {
							afterSelector = afterSelector.replace(/^\s*/, '');
						}

						fixedSelector = beforeSelector + afterSelector;
					});

				if (ruleNode.raws.selector) {
					ruleNode.raws.selector.raw = fixedSelector;
				} else {
					ruleNode.selector = fixedSelector;
				}
			}
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
