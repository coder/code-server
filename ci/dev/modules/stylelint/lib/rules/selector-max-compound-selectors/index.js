// @ts-nocheck

'use strict';

const isContextFunctionalPseudoClass = require('../../utils/isContextFunctionalPseudoClass');
const isNonNegativeInteger = require('../../utils/isNonNegativeInteger');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const resolvedNestedSelector = require('postcss-resolve-nested-selector');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'selector-max-compound-selectors';

const messages = ruleMessages(ruleName, {
	expected: (selector, max) =>
		`Expected "${selector}" to have no more than ${max} compound ${
			max === 1 ? 'selector' : 'selectors'
		}`,
});

function rule(max) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: max,
			possible: isNonNegativeInteger,
		});

		if (!validOptions) {
			return;
		}

		// Finds actual selectors in selectorNode object and checks them
		function checkSelector(selectorNode, ruleNode) {
			let compoundCount = 1;

			selectorNode.each((childNode) => {
				// Only traverse inside actual selectors and context functional pseudo-classes
				if (childNode.type === 'selector' || isContextFunctionalPseudoClass(childNode)) {
					checkSelector(childNode, ruleNode);
				}

				// Compound selectors are separated by combinators, so increase count when meeting one
				if (childNode.type === 'combinator') {
					compoundCount++;
				}
			});

			if (selectorNode.type !== 'root' && selectorNode.type !== 'pseudo' && compoundCount > max) {
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
			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			// Using `.selectors` gets us each selector if there is a comma separated set
			ruleNode.selectors.forEach((selector) => {
				resolvedNestedSelector(selector, ruleNode).forEach((resolvedSelector) => {
					// Process each resolved selector with `checkSelector` via postcss-selector-parser
					parseSelector(resolvedSelector, result, ruleNode, (s) => checkSelector(s, ruleNode));
				});
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
