// @ts-nocheck

'use strict';

const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const isStandardSyntaxSelector = require('../../utils/isStandardSyntaxSelector');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'string-no-newline';
const reNewLine = /(\r?\n)/;

const messages = ruleMessages(ruleName, {
	rejected: 'Unexpected newline in string',
});

function rule(actual) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

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
			// Get out quickly if there are no new line
			if (!reNewLine.test(ruleNode.selector)) {
				return;
			}

			if (!isStandardSyntaxSelector(ruleNode.selector)) {
				return;
			}

			parseSelector(ruleNode.selector, result, ruleNode, (selectorTree) => {
				selectorTree.walkAttributes((attributeNode) => {
					if (!reNewLine.test(attributeNode.value)) {
						return;
					}

					const openIndex = [
						// length of our attribute
						attributeNode.attribute,
						// length of our operator , ie '='
						attributeNode.operator,
						// length of the contents before newline
						RegExp.leftContext,
					].reduce(
						(index, str) => index + str.length,
						// index of the start of our attribute node in our source
						attributeNode.sourceIndex,
					);

					report({
						message: messages.rejected,
						node: ruleNode,
						index: openIndex,
						result,
						ruleName,
					});
				});
			});
		}

		function checkDeclOrAtRule(node, value, getIndex) {
			// Get out quickly if there are no new line
			if (!reNewLine.test(value)) {
				return;
			}

			valueParser(value).walk((valueNode) => {
				if (valueNode.type !== 'string' || !reNewLine.test(valueNode.value)) {
					return;
				}

				const openIndex = [
					// length of the quote
					valueNode.quote,
					// length of the contents before newline
					RegExp.leftContext,
				].reduce((index, str) => index + str.length, valueNode.sourceIndex);

				report({
					message: messages.rejected,
					node,
					index: getIndex(node) + openIndex,
					result,
					ruleName,
				});
			});
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
