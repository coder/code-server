// @ts-nocheck

'use strict';

const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'number-leading-zero';

const messages = ruleMessages(ruleName, {
	expected: 'Expected a leading zero',
	rejected: 'Unexpected leading zero',
});

function rule(expectation, secondary, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never'],
		});

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
			const neverFixPositions = [];
			const alwaysFixPositions = [];

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

				// Check leading zero
				if (expectation === 'always') {
					const match = /(?:\D|^)(\.\d+)/.exec(valueNode.value);

					if (match === null) {
						return;
					}

					// The regexp above consists of 2 capturing groups (or capturing parentheses).
					// We need the index of the second group. This makes sanse when we have "-.5" as an input
					// for regex. And we need the index of ".5".
					const capturingGroupIndex = match[0].length - match[1].length;

					const index = valueNode.sourceIndex + match.index + capturingGroupIndex;

					if (context.fix) {
						alwaysFixPositions.unshift({
							index,
						});

						return;
					}

					complain(messages.expected, node, getIndex(node) + index);
				}

				if (expectation === 'never') {
					const match = /(?:\D|^)(0+)(\.\d+)/.exec(valueNode.value);

					if (match === null) {
						return;
					}

					// The regexp above consists of 3 capturing groups (or capturing parentheses).
					// We need the index of the second group. This makes sanse when we have "-00.5"
					// as an input for regex. And we need the index of "00".
					const capturingGroupIndex = match[0].length - (match[1].length + match[2].length);

					const index = valueNode.sourceIndex + match.index + capturingGroupIndex;

					if (context.fix) {
						neverFixPositions.unshift({
							startIndex: index,
							// match[1].length is the length of our matched zero(s)
							endIndex: index + match[1].length,
						});

						return;
					}

					complain(messages.rejected, node, getIndex(node) + index);
				}
			});

			if (alwaysFixPositions.length) {
				alwaysFixPositions.forEach((fixPosition) => {
					const index = fixPosition.index;

					if (node.type === 'atrule') {
						node.params = addLeadingZero(node.params, index);
					} else {
						node.value = addLeadingZero(node.value, index);
					}
				});
			}

			if (neverFixPositions.length) {
				neverFixPositions.forEach((fixPosition) => {
					const startIndex = fixPosition.startIndex;
					const endIndex = fixPosition.endIndex;

					if (node.type === 'atrule') {
						node.params = removeLeadingZeros(node.params, startIndex, endIndex);
					} else {
						node.value = removeLeadingZeros(node.value, startIndex, endIndex);
					}
				});
			}
		}

		function complain(message, node, index) {
			report({
				result,
				ruleName,
				message,
				node,
				index,
			});
		}
	};
}

function addLeadingZero(input, index) {
	// eslint-disable-next-line prefer-template
	return input.slice(0, index) + '0' + input.slice(index);
}

function removeLeadingZeros(input, startIndex, endIndex) {
	return input.slice(0, startIndex) + input.slice(endIndex);
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
