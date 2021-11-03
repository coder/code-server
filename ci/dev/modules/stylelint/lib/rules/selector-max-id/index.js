// @ts-nocheck

'use strict';

const _ = require('lodash');
const isContextFunctionalPseudoClass = require('../../utils/isContextFunctionalPseudoClass');
const isNonNegativeInteger = require('../../utils/isNonNegativeInteger');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const optionsMatches = require('../../utils/optionsMatches');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const resolvedNestedSelector = require('postcss-resolve-nested-selector');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'selector-max-id';

const messages = ruleMessages(ruleName, {
	expected: (selector, max) =>
		`Expected "${selector}" to have no more than ${max} ID ${max === 1 ? 'selector' : 'selectors'}`,
});

function rule(max, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: max,
				possible: isNonNegativeInteger,
			},
			{
				actual: options,
				possible: {
					ignoreContextFunctionalPseudoClasses: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		function checkSelector(selectorNode, ruleNode) {
			const count = selectorNode.reduce((total, childNode) => {
				// Only traverse inside actual selectors and context functional pseudo-classes that are not part of ignored functional pseudo-classes
				if (
					childNode.type === 'selector' ||
					(isContextFunctionalPseudoClass(childNode) &&
						!isIgnoredContextFunctionalPseudoClass(childNode))
				) {
					checkSelector(childNode, ruleNode);
				}

				return (total += childNode.type === 'id' ? 1 : 0);
			}, 0);

			if (selectorNode.type !== 'root' && selectorNode.type !== 'pseudo' && count > max) {
				report({
					ruleName,
					result,
					node: ruleNode,
					message: messages.expected(selectorNode, max),
					word: selectorNode,
				});
			}
		}

		function isIgnoredContextFunctionalPseudoClass(node) {
			return (
				node.type === 'pseudo' &&
				optionsMatches(options, 'ignoreContextFunctionalPseudoClasses', node.value)
			);
		}

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			ruleNode.selectors.forEach((selector) => {
				resolvedNestedSelector(selector, ruleNode).forEach((resolvedSelector) => {
					parseSelector(resolvedSelector, result, ruleNode, (container) =>
						checkSelector(container, ruleNode),
					);
				});
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
