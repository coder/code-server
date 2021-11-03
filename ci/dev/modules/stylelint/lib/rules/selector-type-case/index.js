// @ts-nocheck

'use strict';

const _ = require('lodash');
const isKeyframeSelector = require('../../utils/isKeyframeSelector');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const isStandardSyntaxTypeSelector = require('../../utils/isStandardSyntaxTypeSelector');
const optionsMatches = require('../../utils/optionsMatches');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'selector-type-case';

const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
});

function rule(expectation, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: expectation,
				possible: ['lower', 'upper'],
			},
			{
				actual: options,
				possible: {
					ignoreTypes: [_.isString],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkRules((ruleNode) => {
			let hasComments = _.get(ruleNode, 'raws.selector.raw');
			const selector = hasComments ? hasComments : ruleNode.selector;
			const selectors = ruleNode.selectors;

			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			if (selectors.some((s) => isKeyframeSelector(s))) {
				return;
			}

			parseSelector(selector, result, ruleNode, (selectorAST) => {
				selectorAST.walkTags((tag) => {
					if (!isStandardSyntaxTypeSelector(tag)) {
						return;
					}

					if (optionsMatches(options, 'ignoreTypes', tag.value)) {
						return;
					}

					const sourceIndex = tag.sourceIndex;
					const value = tag.value;

					const expectedValue = expectation === 'lower' ? value.toLowerCase() : value.toUpperCase();

					if (value === expectedValue) {
						return;
					}

					if (context.fix) {
						if (hasComments) {
							hasComments =
								hasComments.slice(0, sourceIndex) +
								expectedValue +
								hasComments.slice(sourceIndex + value.length);
							_.set(ruleNode, 'raws.selector.raw', hasComments);
						} else {
							ruleNode.selector =
								ruleNode.selector.slice(0, sourceIndex) +
								expectedValue +
								ruleNode.selector.slice(sourceIndex + value.length);
						}

						return;
					}

					report({
						message: messages.expected(value, expectedValue),
						node: ruleNode,
						index: sourceIndex,
						ruleName,
						result,
					});
				});
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
