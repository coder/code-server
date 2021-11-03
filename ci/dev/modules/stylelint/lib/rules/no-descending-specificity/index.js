// @ts-nocheck

'use strict';

const _ = require('lodash');
const findAtRuleContext = require('../../utils/findAtRuleContext');
const isCustomPropertySet = require('../../utils/isCustomPropertySet');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const isStandardSyntaxSelector = require('../../utils/isStandardSyntaxSelector');
const keywordSets = require('../../reference/keywordSets');
const nodeContextLookup = require('../../utils/nodeContextLookup');
const optionsMatches = require('../../utils/optionsMatches');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const resolvedNestedSelector = require('postcss-resolve-nested-selector');
const ruleMessages = require('../../utils/ruleMessages');
const specificity = require('specificity');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'no-descending-specificity';

const messages = ruleMessages(ruleName, {
	rejected: (b, a) => `Expected selector "${b}" to come before selector "${a}"`,
});

function rule(on, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: on,
			},
			{
				optional: true,
				actual: options,
				possible: {
					ignore: ['selectors-within-list'],
				},
			},
		);

		if (!validOptions) {
			return;
		}

		const selectorContextLookup = nodeContextLookup();

		root.walkRules((ruleNode) => {
			// Ignore custom property set `--foo: {};`
			if (isCustomPropertySet(ruleNode)) {
				return;
			}

			// Ignore nested property `foo: {};`
			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			// Ignores selectors within list of selectors
			if (
				optionsMatches(options, 'ignore', 'selectors-within-list') &&
				ruleNode.selectors.length > 1
			) {
				return;
			}

			const comparisonContext = selectorContextLookup.getContext(
				ruleNode,
				findAtRuleContext(ruleNode),
			);

			ruleNode.selectors.forEach((selector) => {
				const trimSelector = selector.trim();

				// Ignore `.selector, { }`
				if (trimSelector === '') {
					return;
				}

				// The edge-case of duplicate selectors will act acceptably
				const index = ruleNode.selector.indexOf(trimSelector);

				// Resolve any nested selectors before checking
				resolvedNestedSelector(selector, ruleNode).forEach((resolvedSelector) => {
					parseSelector(resolvedSelector, result, ruleNode, (s) => {
						if (!isStandardSyntaxSelector(resolvedSelector)) {
							return;
						}

						checkSelector(s, ruleNode, index, comparisonContext);
					});
				});
			});
		});

		function checkSelector(selectorNode, ruleNode, sourceIndex, comparisonContext) {
			const selector = selectorNode.toString();
			const referenceSelectorNode = lastCompoundSelectorWithoutPseudoClasses(selectorNode);
			const selectorSpecificity = specificity.calculate(selector)[0].specificityArray;
			const entry = { selector, specificity: selectorSpecificity };

			if (!comparisonContext.has(referenceSelectorNode)) {
				comparisonContext.set(referenceSelectorNode, [entry]);

				return;
			}

			const priorComparableSelectors = comparisonContext.get(referenceSelectorNode);

			priorComparableSelectors.forEach((priorEntry) => {
				if (specificity.compare(selectorSpecificity, priorEntry.specificity) === -1) {
					report({
						ruleName,
						result,
						node: ruleNode,
						message: messages.rejected(selector, priorEntry.selector),
						index: sourceIndex,
					});
				}
			});

			priorComparableSelectors.push(entry);
		}
	};
}

function lastCompoundSelectorWithoutPseudoClasses(selectorNode) {
	const nodesAfterLastCombinator = _.last(
		selectorNode.nodes[0].split((node) => {
			return node.type === 'combinator';
		}),
	);

	const nodesWithoutPseudoClasses = nodesAfterLastCombinator
		.filter((node) => {
			return node.type !== 'pseudo' || keywordSets.pseudoElements.has(node.value.replace(/:/g, ''));
		})
		.join('');

	return nodesWithoutPseudoClasses.toString();
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
