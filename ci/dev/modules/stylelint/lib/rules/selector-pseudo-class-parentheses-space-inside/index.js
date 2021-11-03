// @ts-nocheck

'use strict';

const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'selector-pseudo-class-parentheses-space-inside';

const messages = ruleMessages(ruleName, {
	expectedOpening: 'Expected single space after "("',
	rejectedOpening: 'Unexpected whitespace after "("',
	expectedClosing: 'Expected single space before ")"',
	rejectedClosing: 'Unexpected whitespace before ")"',
});

function rule(expectation, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never'],
		});

		if (!validOptions) {
			return;
		}

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			if (!ruleNode.selector.includes('(')) {
				return;
			}

			let hasFixed = false;
			const selector = ruleNode.raws.selector ? ruleNode.raws.selector.raw : ruleNode.selector;
			const fixedSelector = parseSelector(selector, result, ruleNode, (selectorTree) => {
				selectorTree.walkPseudos((pseudoNode) => {
					if (!pseudoNode.length) {
						return;
					}

					const paramString = pseudoNode.map(String).join(',');
					const nextCharIsSpace = paramString.startsWith(' ');
					const openIndex =
						pseudoNode.sourceIndex + stringifyProperty(pseudoNode, 'value').length + 1;

					if (nextCharIsSpace && expectation === 'never') {
						if (context.fix) {
							hasFixed = true;
							setFirstNodeSpaceBefore(pseudoNode, '');
						} else {
							complain(messages.rejectedOpening, openIndex);
						}
					}

					if (!nextCharIsSpace && expectation === 'always') {
						if (context.fix) {
							hasFixed = true;
							setFirstNodeSpaceBefore(pseudoNode, ' ');
						} else {
							complain(messages.expectedOpening, openIndex);
						}
					}

					const prevCharIsSpace = paramString.endsWith(' ');
					const closeIndex = openIndex + paramString.length - 1;

					if (prevCharIsSpace && expectation === 'never') {
						if (context.fix) {
							hasFixed = true;
							setLastNodeSpaceAfter(pseudoNode, '');
						} else {
							complain(messages.rejectedClosing, closeIndex);
						}
					}

					if (!prevCharIsSpace && expectation === 'always') {
						if (context.fix) {
							hasFixed = true;
							setLastNodeSpaceAfter(pseudoNode, ' ');
						} else {
							complain(messages.expectedClosing, closeIndex);
						}
					}
				});
			});

			if (hasFixed) {
				if (!ruleNode.raws.selector) {
					ruleNode.selector = fixedSelector;
				} else {
					ruleNode.raws.selector.raw = fixedSelector;
				}
			}

			function complain(message, index) {
				report({
					message,
					index,
					result,
					ruleName,
					node: ruleNode,
				});
			}
		});
	};
}

function setFirstNodeSpaceBefore(node, value) {
	const target = node.first;

	if (target.type === 'selector') {
		setFirstNodeSpaceBefore(target, value);
	} else {
		target.spaces.before = value;
	}
}

function setLastNodeSpaceAfter(node, value) {
	const target = node.last;

	if (target.type === 'selector') {
		setLastNodeSpaceAfter(target, value);
	} else {
		target.spaces.after = value;
	}
}

function stringifyProperty(node, propName) {
	return (node.raws && node.raws[propName]) || node[propName];
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
