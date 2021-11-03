// @ts-nocheck

'use strict';

const ruleMessages = require('../../utils/ruleMessages');
const selectorListCommaWhitespaceChecker = require('../selectorListCommaWhitespaceChecker');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'selector-list-comma-space-after';

const messages = ruleMessages(ruleName, {
	expectedAfter: () => 'Expected single space after ","',
	rejectedAfter: () => 'Unexpected whitespace after ","',
	expectedAfterSingleLine: () => 'Expected single space after "," in a single-line list',
	rejectedAfterSingleLine: () => 'Unexpected whitespace after "," in a single-line list',
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
			locationChecker: checker.after,
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
						const beforeSelector = selector.slice(0, index + 1);
						let afterSelector = selector.slice(index + 1);

						if (expectation.startsWith('always')) {
							afterSelector = afterSelector.replace(/^\s*/, ' ');
						} else if (expectation.startsWith('never')) {
							afterSelector = afterSelector.replace(/^\s*/, '');
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
