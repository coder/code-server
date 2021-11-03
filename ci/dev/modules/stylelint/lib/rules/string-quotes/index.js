// @ts-nocheck

'use strict';

const _ = require('lodash');
const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'string-quotes';

const messages = ruleMessages(ruleName, {
	expected: (q) => `Expected ${q} quotes`,
});

const singleQuote = `'`;
const doubleQuote = `"`;

function rule(expectation, secondary, context) {
	const correctQuote = expectation === 'single' ? singleQuote : doubleQuote;
	const erroneousQuote = expectation === 'single' ? doubleQuote : singleQuote;

	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: expectation,
				possible: ['single', 'double'],
			},
			{
				actual: secondary,
				possible: {
					avoidEscape: _.isBoolean,
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		const avoidEscape = _.get(secondary, 'avoidEscape', true);

		root.walk((node) => {
			switch (node.type) {
				case 'atrule':
					checkDeclOrAtRule(node, node.params, atRuleParamIndex);
					break;
				case 'decl':
					checkDeclOrAtRule(node, node.value, declarationValueIndex);
					break;
				case 'rule':
					checkRule(node);
					break;
			}
		});

		function checkRule(ruleNode) {
			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			if (!ruleNode.selector.includes('[') || !ruleNode.selector.includes('=')) {
				return;
			}

			const fixPositions = [];

			parseSelector(ruleNode.selector, result, ruleNode, (selectorTree) => {
				let selectorFixed = false;

				selectorTree.walkAttributes((attributeNode) => {
					if (!attributeNode.quoted) {
						return;
					}

					if (attributeNode.quoteMark === correctQuote) {
						if (avoidEscape) {
							const needsCorrectEscape = attributeNode.value.includes(correctQuote);
							const needsOtherEscape = attributeNode.value.includes(erroneousQuote);

							if (needsOtherEscape) {
								return;
							}

							if (needsCorrectEscape) {
								if (context.fix) {
									selectorFixed = true;
									attributeNode.quoteMark = erroneousQuote;
								} else {
									report({
										message: messages.expected(expectation === 'single' ? 'double' : expectation),
										node: ruleNode,
										index: attributeNode.sourceIndex + attributeNode.offsetOf('value'),
										result,
										ruleName,
									});
								}
							}
						}
					}

					if (attributeNode.quoteMark === erroneousQuote) {
						if (avoidEscape) {
							const needsCorrectEscape = attributeNode.value.includes(correctQuote);
							const needsOtherEscape = attributeNode.value.includes(erroneousQuote);

							if (needsOtherEscape) {
								if (context.fix) {
									selectorFixed = true;
									attributeNode.quoteMark = correctQuote;
								} else {
									report({
										message: messages.expected(expectation),
										node: ruleNode,
										index: attributeNode.sourceIndex + attributeNode.offsetOf('value'),
										result,
										ruleName,
									});
								}

								return;
							}

							if (needsCorrectEscape) {
								return;
							}
						}

						if (context.fix) {
							selectorFixed = true;
							attributeNode.quoteMark = correctQuote;
						} else {
							report({
								message: messages.expected(expectation),
								node: ruleNode,
								index: attributeNode.sourceIndex + attributeNode.offsetOf('value'),
								result,
								ruleName,
							});
						}
					}
				});

				if (selectorFixed) {
					ruleNode.selector = selectorTree.toString();
				}
			});

			fixPositions.forEach((fixIndex) => {
				ruleNode.selector = replaceQuote(ruleNode.selector, fixIndex, correctQuote);
			});
		}

		function checkDeclOrAtRule(node, value, getIndex) {
			const fixPositions = [];

			// Get out quickly if there are no erroneous quotes
			if (!value.includes(erroneousQuote)) {
				return;
			}

			if (node.type === 'atrule' && node.name === 'charset') {
				// allow @charset rules to have double quotes, in spite of the configuration
				// TODO: @charset should always use double-quotes, see https://github.com/stylelint/stylelint/issues/2788
				return;
			}

			valueParser(value).walk((valueNode) => {
				if (valueNode.type === 'string' && valueNode.quote === erroneousQuote) {
					const needsEscape = valueNode.value.includes(correctQuote);

					if (avoidEscape && needsEscape) {
						// don't consider this an error
						return;
					}

					const openIndex = valueNode.sourceIndex;

					// we currently don't fix escapes
					if (context.fix && !needsEscape) {
						const closeIndex = openIndex + valueNode.value.length + erroneousQuote.length;

						fixPositions.push(openIndex, closeIndex);
					} else {
						report({
							message: messages.expected(expectation),
							node,
							index: getIndex(node) + openIndex,
							result,
							ruleName,
						});
					}
				}
			});

			fixPositions.forEach((fixIndex) => {
				if (node.type === 'atrule') {
					node.params = replaceQuote(node.params, fixIndex, correctQuote);
				} else {
					node.value = replaceQuote(node.value, fixIndex, correctQuote);
				}
			});
		}
	};
}

function replaceQuote(string, index, replace) {
	return string.substring(0, index) + replace + string.substring(index + replace.length);
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
