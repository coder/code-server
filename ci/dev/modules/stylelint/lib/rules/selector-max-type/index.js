// @ts-nocheck

'use strict';

const _ = require('lodash');
const isContextFunctionalPseudoClass = require('../../utils/isContextFunctionalPseudoClass');
const isKeyframeSelector = require('../../utils/isKeyframeSelector');
const isNonNegativeInteger = require('../../utils/isNonNegativeInteger');
const isOnlyWhitespace = require('../../utils/isOnlyWhitespace');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const isStandardSyntaxSelector = require('../../utils/isStandardSyntaxSelector');
const isStandardSyntaxTypeSelector = require('../../utils/isStandardSyntaxTypeSelector');
const optionsMatches = require('../../utils/optionsMatches');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const resolvedNestedSelector = require('postcss-resolve-nested-selector');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'selector-max-type';

const messages = ruleMessages(ruleName, {
	expected: (selector, max) =>
		`Expected "${selector}" to have no more than ${max} type ${
			max === 1 ? 'selector' : 'selectors'
		}`,
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
					ignore: ['descendant', 'child', 'compounded', 'next-sibling'],
					ignoreTypes: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		const ignoreDescendant = optionsMatches(options, 'ignore', 'descendant');
		const ignoreChild = optionsMatches(options, 'ignore', 'child');
		const ignoreCompounded = optionsMatches(options, 'ignore', 'compounded');
		const ignoreNextSibling = optionsMatches(options, 'ignore', 'next-sibling');

		function checkSelector(selectorNode, ruleNode) {
			const count = selectorNode.reduce((total, childNode) => {
				// Only traverse inside actual selectors and context functional pseudo-classes
				if (childNode.type === 'selector' || isContextFunctionalPseudoClass(childNode)) {
					checkSelector(childNode, ruleNode);
				}

				if (optionsMatches(options, 'ignoreTypes', childNode.value)) {
					return total;
				}

				if (ignoreDescendant && hasDescendantCombinatorBefore(childNode)) {
					return total;
				}

				if (ignoreChild && hasChildCombinatorBefore(childNode)) {
					return total;
				}

				if (ignoreCompounded && hasCompoundSelector(childNode)) {
					return total;
				}

				if (ignoreNextSibling && hasNextSiblingCombinator(childNode)) {
					return total;
				}

				if (childNode.type === 'tag' && !isStandardSyntaxTypeSelector(childNode)) {
					return total;
				}

				return total + (childNode.type === 'tag');
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

		root.walkRules((ruleNode) => {
			const selectors = ruleNode.selectors;

			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			if (selectors.some((s) => isKeyframeSelector(s))) {
				return;
			}

			ruleNode.selectors.forEach((selector) => {
				resolvedNestedSelector(selector, ruleNode).forEach((resolvedSelector) => {
					if (!isStandardSyntaxSelector(resolvedSelector)) {
						return;
					}

					parseSelector(resolvedSelector, result, ruleNode, (container) =>
						checkSelector(container, ruleNode),
					);
				});
			});
		});
	};
}

function hasDescendantCombinatorBefore(node) {
	const nodeIndex = node.parent.nodes.indexOf(node);

	return node.parent.nodes.slice(0, nodeIndex).some(isDescendantCombinator);
}

function hasChildCombinatorBefore(node) {
	const nodeIndex = node.parent.nodes.indexOf(node);

	return node.parent.nodes.slice(0, nodeIndex).some(isChildCombinator);
}

function hasCompoundSelector(node) {
	if (node.prev() && !isCombinator(node.prev())) {
		return true;
	}

	return node.next() && !isCombinator(node.next());
}

function hasNextSiblingCombinator(node) {
	return node.prev() && isNextSiblingCombinator(node.prev());
}

function isCombinator(node) {
	if (!node) return false;

	return _.get(node, 'type') === 'combinator';
}

function isDescendantCombinator(node) {
	if (!node) return false;

	return isCombinator(node) && isOnlyWhitespace(node.value);
}

function isChildCombinator(node) {
	if (!node) return false;

	return isCombinator(node) && node.value === '>';
}

function isNextSiblingCombinator(node) {
	return isCombinator(node) && node.value === '+';
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
