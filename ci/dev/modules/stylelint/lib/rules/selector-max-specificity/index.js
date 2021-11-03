// @ts-nocheck

'use strict';

const _ = require('lodash');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const isStandardSyntaxSelector = require('../../utils/isStandardSyntaxSelector');
const keywordSets = require('../../reference/keywordSets');
const optionsMatches = require('../../utils/optionsMatches');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const resolvedNestedSelector = require('postcss-resolve-nested-selector');
const ruleMessages = require('../../utils/ruleMessages');
const specificity = require('specificity');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'selector-max-specificity';

const messages = ruleMessages(ruleName, {
	expected: (selector, max) => `Expected "${selector}" to have a specificity no more than "${max}"`,
});

// Return an array representation of zero specificity. We need a new array each time so that it can mutated
const zeroSpecificity = () => [0, 0, 0, 0];

// Calculate the sum of given array of specificity arrays
const specificitySum = (specificities) => {
	const sum = zeroSpecificity();

	specificities.forEach((specificityArray) => {
		specificityArray.forEach((value, i) => {
			sum[i] += value;
		});
	});

	return sum;
};

function rule(max, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: max,
				possible: [
					// Check that the max specificity is in the form "a,b,c"
					(spec) => /^\d+,\d+,\d+$/.test(spec),
				],
			},
			{
				actual: options,
				possible: {
					ignoreSelectors: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		// Calculate the specificity of a simple selector (type, attribute, class, ID, or pseudos's own value)
		const simpleSpecificity = (selector) => {
			if (optionsMatches(options, 'ignoreSelectors', selector)) {
				return zeroSpecificity();
			}

			return specificity.calculate(selector)[0].specificityArray;
		};

		// Calculate the the specificity of the most specific direct child
		const maxChildSpecificity = (node) =>
			node.reduce((maxSpec, child) => {
				const childSpecificity = nodeSpecificity(child); // eslint-disable-line no-use-before-define

				return specificity.compare(childSpecificity, maxSpec) === 1 ? childSpecificity : maxSpec;
			}, zeroSpecificity());

		// Calculate the specificity of a pseudo selector including own value and children
		const pseudoSpecificity = (node) => {
			// `node.toString()` includes children which should be processed separately,
			// so use `node.value` instead
			const ownValue = node.value;
			const ownSpecificity =
				ownValue === ':not' || ownValue === ':matches'
					? // :not and :matches don't add specificity themselves, but their children do
					  zeroSpecificity()
					: simpleSpecificity(ownValue);

			return specificitySum([ownSpecificity, maxChildSpecificity(node)]);
		};

		const shouldSkipPseudoClassArgument = (node) => {
			// postcss-selector-parser includes the arguments to nth-child() functions
			// as "tags", so we need to ignore them ourselves.
			// The fake-tag's "parent" is actually a selector node, whose parent
			// should be the :nth-child pseudo node.
			const parentNode = node.parent.parent;

			if (parentNode && parentNode.value) {
				const parentNodeValue = parentNode.value;
				const normalisedParentNode = parentNodeValue.toLowerCase().replace(/:+/, '');

				return (
					parentNode.type === 'pseudo' &&
					(keywordSets.aNPlusBNotationPseudoClasses.has(normalisedParentNode) ||
						keywordSets.linguisticPseudoClasses.has(normalisedParentNode))
				);
			}

			return false;
		};

		// Calculate the specificity of a node parsed by `postcss-selector-parser`
		const nodeSpecificity = (node) => {
			if (shouldSkipPseudoClassArgument(node)) {
				return zeroSpecificity();
			}

			switch (node.type) {
				case 'attribute':
				case 'class':
				case 'id':
				case 'tag':
					return simpleSpecificity(node.toString());
				case 'pseudo':
					return pseudoSpecificity(node);
				case 'selector':
					// Calculate the sum of all the direct children
					return specificitySum(node.map(nodeSpecificity));
				default:
					return zeroSpecificity();
			}
		};

		const maxSpecificityArray = `0,${max}`.split(',').map(parseFloat);

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			// Using `.selectors` gets us each selector in the eventuality we have a comma separated set
			ruleNode.selectors.forEach((selector) => {
				resolvedNestedSelector(selector, ruleNode).forEach((resolvedSelector) => {
					try {
						// Skip non-standard syntax selectors
						if (!isStandardSyntaxSelector(resolvedSelector)) {
							return;
						}

						parseSelector(resolvedSelector, result, ruleNode, (selectorTree) => {
							// Check if the selector specificity exceeds the allowed maximum
							if (
								specificity.compare(maxChildSpecificity(selectorTree), maxSpecificityArray) === 1
							) {
								report({
									ruleName,
									result,
									node: ruleNode,
									message: messages.expected(resolvedSelector, max),
									word: selector,
								});
							}
						});
					} catch {
						result.warn('Cannot parse selector', {
							node: ruleNode,
							stylelintType: 'parseError',
						});
					}
				});
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
