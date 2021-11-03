// @ts-nocheck

'use strict';

const _ = require('lodash');
const isAutoprefixable = require('../../utils/isAutoprefixable');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const optionsMatches = require('../../utils/optionsMatches');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'selector-no-vendor-prefix';

const messages = ruleMessages(ruleName, {
	rejected: (selector) => `Unexpected vendor-prefix "${selector}"`,
});

function rule(actual, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{ actual },
			{
				actual: options,
				possible: {
					ignoreSelectors: [_.isString],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			const selector = ruleNode.selector;

			parseSelector(selector, result, ruleNode, (selectorTree) => {
				selectorTree.walkPseudos((pseudoNode) => {
					if (isAutoprefixable.selector(pseudoNode.value)) {
						if (optionsMatches(options, 'ignoreSelectors', pseudoNode.value)) {
							return;
						}

						if (context.fix) {
							ruleNode.selector = isAutoprefixable.unprefix(ruleNode.selector);

							return;
						}

						report({
							result,
							ruleName,
							message: messages.rejected(pseudoNode.value),
							node: ruleNode,
							index: (ruleNode.raws.before || '').length + pseudoNode.sourceIndex,
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
