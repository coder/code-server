// @ts-nocheck

'use strict';

const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'number-no-trailing-zeros';

const messages = ruleMessages(ruleName, {
	rejected: 'Unexpected trailing zero(s)',
});

function rule(actual, secondary, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		root.walkAtRules((atRule) => {
			if (atRule.name.toLowerCase() === 'import') {
				return;
			}

			check(atRule, atRule.params, atRuleParamIndex);
		});

		root.walkDecls((decl) => check(decl, decl.value, declarationValueIndex));

		function check(node, value, getIndex) {
			const fixPositions = [];

			// Get out quickly if there are no periods
			if (!value.includes('.')) {
				return;
			}

			valueParser(value).walk((valueNode) => {
				// Ignore `url` function
				if (valueNode.type === 'function' && valueNode.value.toLowerCase() === 'url') {
					return false;
				}

				// Ignore strings, comments, etc
				if (valueNode.type !== 'word') {
					return;
				}

				const match = /\.(\d*?)(0+)(?:\D|$)/.exec(valueNode.value);

				// match[1] is any numbers between the decimal and our trailing zero, could be empty
				// match[2] is our trailing zero(s)
				if (match === null) {
					return;
				}

				// our index is:
				//  the index of our valueNode +
				//  the index of our match +
				//  1 for our decimal +
				//  the length of our potential non-zero number match (match[1])
				const index = valueNode.sourceIndex + match.index + 1 + match[1].length;

				// our startIndex is identical to our index except when we have only
				// trailing zeros after our decimal. in that case we don't need the decimal
				// either so we move our index back by 1.
				const startIndex = match[1].length > 0 ? index : index - 1;

				// our end index is our original index + the length of our trailing zeros
				const endIndex = index + match[2].length;

				if (context.fix) {
					fixPositions.unshift({
						startIndex,
						endIndex,
					});

					return;
				}

				report({
					message: messages.rejected,
					node,
					// this is the index of the _first_ trailing zero
					index: getIndex(node) + index,
					result,
					ruleName,
				});
			});

			if (fixPositions.length) {
				fixPositions.forEach((fixPosition) => {
					const startIndex = fixPosition.startIndex;
					const endIndex = fixPosition.endIndex;

					if (node.type === 'atrule') {
						node.params = removeTrailingZeros(node.params, startIndex, endIndex);
					} else {
						node.value = removeTrailingZeros(node.value, startIndex, endIndex);
					}
				});
			}
		}
	};
}

function removeTrailingZeros(input, startIndex, endIndex) {
	return input.slice(0, startIndex) + input.slice(endIndex);
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
