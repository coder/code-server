// @ts-nocheck

'use strict';

const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const findMediaOperator = require('../findMediaOperator');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'media-feature-range-operator-space-before';

const messages = ruleMessages(ruleName, {
	expectedBefore: () => 'Expected single space before range operator',
	rejectedBefore: () => 'Unexpected whitespace before range operator',
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
				checkBeforeOperator(match, params, node, fix);
			});

			if (fixOperatorIndices.length) {
				let params = atRule.raws.params ? atRule.raws.params.raw : atRule.params;

				fixOperatorIndices
					.sort((a, b) => b - a)
					.forEach((index) => {
						const beforeOperator = params.slice(0, index);
						const afterOperator = params.slice(index);

						if (expectation === 'always') {
							params = beforeOperator.replace(/\s*$/, ' ') + afterOperator;
						} else if (expectation === 'never') {
							params = beforeOperator.replace(/\s*$/, '') + afterOperator;
						}
					});

				if (atRule.raws.params) {
					atRule.raws.params.raw = params;
				} else {
					atRule.params = params;
				}
			}
		});

		function checkBeforeOperator(match, params, node, fix) {
			// The extra `+ 1` is because the match itself contains
			// the character before the operator
			checker.before({
				source: params,
				index: match.startIndex,
				err: (m) => {
					if (fix) {
						fix(match.startIndex);

						return;
					}

					report({
						message: m,
						node,
						index: match.startIndex - 1 + atRuleParamIndex(node),
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
