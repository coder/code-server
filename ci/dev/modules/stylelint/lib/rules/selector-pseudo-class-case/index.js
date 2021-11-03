// @ts-nocheck

'use strict';

const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const isStandardSyntaxSelector = require('../../utils/isStandardSyntaxSelector');
const keywordSets = require('../../reference/keywordSets');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'selector-pseudo-class-case';

const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
});

function rule(expectation, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['lower', 'upper'],
		});

		if (!validOptions) {
			return;
		}

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			const selector = ruleNode.selector;

			if (!selector.includes(':')) {
				return;
			}

			const fixedSelector = parseSelector(
				ruleNode.raws.selector ? ruleNode.raws.selector.raw : ruleNode.selector,
				result,
				ruleNode,
				(selectorTree) => {
					selectorTree.walkPseudos((pseudoNode) => {
						const pseudo = pseudoNode.value;

						if (!isStandardSyntaxSelector(pseudo)) {
							return;
						}

						if (
							pseudo.includes('::') ||
							keywordSets.levelOneAndTwoPseudoElements.has(pseudo.toLowerCase().slice(1))
						) {
							return;
						}

						const expectedPseudo =
							expectation === 'lower' ? pseudo.toLowerCase() : pseudo.toUpperCase();

						if (pseudo === expectedPseudo) {
							return;
						}

						if (context.fix) {
							pseudoNode.value = expectedPseudo;

							return;
						}

						report({
							message: messages.expected(pseudo, expectedPseudo),
							node: ruleNode,
							index: pseudoNode.sourceIndex,
							ruleName,
							result,
						});
					});
				},
			);

			if (context.fix) {
				if (ruleNode.raws.selector) {
					ruleNode.raws.selector.raw = fixedSelector;
				} else {
					ruleNode.selector = fixedSelector;
				}
			}
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
