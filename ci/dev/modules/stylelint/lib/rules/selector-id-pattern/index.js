// @ts-nocheck

'use strict';

const _ = require('lodash');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'selector-id-pattern';

const messages = ruleMessages(ruleName, {
	expected: (selectorValue, pattern) =>
		`Expected ID selector "#${selectorValue}" to match pattern "${pattern}"`,
});

function rule(pattern) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: pattern,
			possible: [_.isRegExp, _.isString],
		});

		if (!validOptions) {
			return;
		}

		const normalizedPattern = _.isString(pattern) ? new RegExp(pattern) : pattern;

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			const selector = ruleNode.selector;

			parseSelector(selector, result, ruleNode, (fullSelector) => {
				fullSelector.walk((selectorNode) => {
					if (selectorNode.type !== 'id') {
						return;
					}

					const value = selectorNode.value;
					const sourceIndex = selectorNode.sourceIndex;

					if (normalizedPattern.test(value)) {
						return;
					}

					report({
						result,
						ruleName,
						message: messages.expected(value, pattern),
						node: ruleNode,
						index: sourceIndex,
					});
				});
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
