// @ts-nocheck

'use strict';

const _ = require('lodash');
const isKeyframeSelector = require('../../utils/isKeyframeSelector');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const isStandardSyntaxSelector = require('../../utils/isStandardSyntaxSelector');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const resolveNestedSelector = require('postcss-resolve-nested-selector');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'selector-class-pattern';

const messages = ruleMessages(ruleName, {
	expected: (selectorValue, pattern) =>
		`Expected class selector ".${selectorValue}" to match pattern "${pattern}"`,
});

function rule(pattern, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: pattern,
				possible: [_.isRegExp, _.isString],
			},
			{
				actual: options,
				possible: {
					resolveNestedSelectors: _.isBoolean,
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		const shouldResolveNestedSelectors = _.get(options, 'resolveNestedSelectors');
		const normalizedPattern = _.isString(pattern) ? new RegExp(pattern) : pattern;

		root.walkRules((ruleNode) => {
			const selector = ruleNode.selector;
			const selectors = ruleNode.selectors;

			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			if (selectors.some((s) => isKeyframeSelector(s))) {
				return;
			}

			// Only bother resolving selectors that have an interpolating &
			if (shouldResolveNestedSelectors && hasInterpolatingAmpersand(selector)) {
				resolveNestedSelector(selector, ruleNode).forEach((nestedSelector) => {
					if (!isStandardSyntaxSelector(nestedSelector)) {
						return;
					}

					parseSelector(nestedSelector, result, ruleNode, (s) => checkSelector(s, ruleNode));
				});
			} else {
				parseSelector(selector, result, ruleNode, (s) => checkSelector(s, ruleNode));
			}
		});

		function checkSelector(fullSelector, ruleNode) {
			fullSelector.walkClasses((classNode) => {
				const value = classNode.value;
				const sourceIndex = classNode.sourceIndex;

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
		}
	};
}

// An "interpolating ampersand" means an "&" used to interpolate
// within another simple selector, rather than an "&" that
// stands on its own as a simple selector
function hasInterpolatingAmpersand(selector) {
	for (let i = 0, l = selector.length; i < l; i++) {
		if (selector[i] !== '&') {
			continue;
		}

		if (selector[i - 1] !== undefined && !isCombinator(selector[i - 1])) {
			return true;
		}

		if (selector[i + 1] !== undefined && !isCombinator(selector[i + 1])) {
			return true;
		}
	}

	return false;
}

function isCombinator(x) {
	return /[\s+>~]/.test(x);
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
