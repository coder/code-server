// @ts-nocheck

'use strict';

const _ = require('lodash');
const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const isCustomSelector = require('../../utils/isCustomSelector');
const isStandardSyntaxAtRule = require('../../utils/isStandardSyntaxAtRule');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const isStandardSyntaxSelector = require('../../utils/isStandardSyntaxSelector');
const keywordSets = require('../../reference/keywordSets');
const optionsMatches = require('../../utils/optionsMatches');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const vendor = require('../../utils/vendor');

const ruleName = 'selector-pseudo-class-no-unknown';

const messages = ruleMessages(ruleName, {
	rejected: (selector) => `Unexpected unknown pseudo-class selector "${selector}"`,
});

function rule(actual, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{ actual },
			{
				actual: options,
				possible: {
					ignorePseudoClasses: [_.isString],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		function check(selector, node) {
			parseSelector(selector, result, node, (selectorTree) => {
				selectorTree.walkPseudos((pseudoNode) => {
					const value = pseudoNode.value;

					if (!isStandardSyntaxSelector(value)) {
						return;
					}

					if (isCustomSelector(value)) {
						return;
					}

					// Ignore pseudo-elements
					if (value.slice(0, 2) === '::') {
						return;
					}

					if (optionsMatches(options, 'ignorePseudoClasses', pseudoNode.value.slice(1))) {
						return;
					}

					let index = null;
					const name = value.slice(1).toLowerCase();

					if (node.type === 'atrule' && node.name === 'page') {
						if (keywordSets.atRulePagePseudoClasses.has(name)) {
							return;
						}

						index = atRuleParamIndex(node) + pseudoNode.sourceIndex;
					} else {
						if (
							vendor.prefix(name) ||
							keywordSets.pseudoClasses.has(name) ||
							keywordSets.pseudoElements.has(name)
						) {
							return;
						}

						let prevPseudoElement = pseudoNode;

						do {
							prevPseudoElement = prevPseudoElement.prev();

							if (prevPseudoElement && prevPseudoElement.value.slice(0, 2) === '::') {
								break;
							}
						} while (prevPseudoElement);

						if (prevPseudoElement) {
							const prevPseudoElementValue = vendor.unprefixed(
								prevPseudoElement.value.toLowerCase().slice(2),
							);

							if (
								keywordSets.webkitProprietaryPseudoElements.has(prevPseudoElementValue) &&
								keywordSets.webkitProprietaryPseudoClasses.has(name)
							) {
								return;
							}
						}

						index = pseudoNode.sourceIndex;
					}

					report({
						message: messages.rejected(value),
						node,
						index,
						ruleName,
						result,
					});
				});
			});
		}

		root.walk((node) => {
			let selector = null;

			if (node.type === 'rule') {
				if (!isStandardSyntaxRule(node)) {
					return;
				}

				selector = node.selector;
			} else if (node.type === 'atrule' && node.name === 'page' && node.params) {
				if (!isStandardSyntaxAtRule(node)) {
					return;
				}

				selector = node.params;
			}

			// Return if selector empty, it is meaning node type is not a rule or a at-rule

			if (!selector) {
				return;
			}

			// Return early before parse if no pseudos for performance

			if (!selector.includes(':')) {
				return;
			}

			check(selector, node);
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
