// @ts-nocheck

'use strict';

const ruleMessages = require('../../utils/ruleMessages');
const selectorListCommaWhitespaceChecker = require('../selectorListCommaWhitespaceChecker');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'selector-list-comma-space-before';

const messages = ruleMessages(ruleName, {
	expectedBefore: () => 'Expected single space before ","',
	rejectedBefore: () => 'Unexpected whitespace before ","',
	expectedBeforeSingleLine: () => 'Expected single space before "," in a single-line list',
	rejectedBeforeSingleLine: () => 'Unexpected whitespace before "," in a single-line list',
});

function rule(expectation, options, context) {
	const checker = whitespaceChecker('space', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never', 'always-single-line', 'never-single-line'],
		});

		if (!validOptions) {
			return;
		}

		let fixData;

		selectorListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			fix: context.fix
				? (ruleNode, index) => {
						fixData = fixData || new Map();
						const commaIndices = fixData.get(ruleNode) || [];

						commaIndices.push(index);
						fixData.set(ruleNode, commaIndices);

						return true;
				  }
				: null,
		});

		if (fixData) {
			fixData.forEach((commaIndices, ruleNode) => {
				let selector = ruleNode.raws.selector ? ruleNode.raws.selector.raw : ruleNode.selector;

				commaIndices
					.sort((a, b) => b - a)
					.forEach((index) => {
						let beforeSelector = selector.slice(0, index);
						const afterSelector = selector.slice(index);

						if (expectation.includes('always')) {
							beforeSelector = beforeSelector.replace(/\s*$/, ' ');
						} else if (expectation.includes('never')) {
							beforeSelector = beforeSelector.replace(/\s*$/, '');
						}

						selector = beforeSelector + afterSelector;
					});

				if (ruleNode.raws.selector) {
					ruleNode.raws.selector.raw = selector;
				} else {
					ruleNode.selector = selector;
				}
			});
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
