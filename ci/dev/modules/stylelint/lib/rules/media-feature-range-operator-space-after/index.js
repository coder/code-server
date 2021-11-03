// @ts-nocheck

'use strict';

const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const findMediaOperator = require('../findMediaOperator');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'media-feature-range-operator-space-after';

const messages = ruleMessages(ruleName, {
	expectedAfter: () => 'Expected single space after range operator',
	rejectedAfter: () => 'Unexpected whitespace after range operator',
});

function rule(expectation, options, context) {
	const checker = whitespaceChecker('space', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never'],
		});

		if (!validOptions) {
			return;
		}

		root.walkAtRules(/^media$/i, (atRule) => {
			const fixOperatorIndices = [];
			const fix = context.fix ? (index) => fixOperatorIndices.push(index) : null;

			findMediaOperator(atRule, (match, params, node) => {
				checkAfterOperator(match, params, node, fix);
			});

			if (fixOperatorIndices.length) {
				let params = atRule.raws.params ? atRule.raws.params.raw : atRule.params;

				fixOperatorIndices
					.sort((a, b) => b - a)
					.forEach((index) => {
						const beforeOperator = params.slice(0, index + 1);
						const afterOperator = params.slice(index + 1);

						if (expectation === 'always') {
							params = beforeOperator + afterOperator.replace(/^\s*/, ' ');
						} else if (expectation === 'never') {
							params = beforeOperator + afterOperator.replace(/^\s*/, '');
						}
					});

				if (atRule.raws.params) {
					atRule.raws.params.raw = params;
				} else {
					atRule.params = params;
				}
			}
		});

		function checkAfterOperator(match, params, node, fix) {
			const endIndex = match.startIndex + match.target.length - 1;

			checker.after({
				source: params,
				index: endIndex,
				err: (m) => {
					if (fix) {
						fix(endIndex);

						return;
					}

					report({
						message: m,
						node,
						index: endIndex + atRuleParamIndex(node) + 1,
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
