// @ts-nocheck

'use strict';

const ruleMessages = require('../../utils/ruleMessages');
const selectorListCommaWhitespaceChecker = require('../selectorListCommaWhitespaceChecker');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'selector-list-comma-newline-before';

const messages = ruleMessages(ruleName, {
	expectedBefore: () => 'Expected newline before ","',
	expectedBeforeMultiLine: () => 'Expected newline before "," in a multi-line list',
	rejectedBeforeMultiLine: () => 'Unexpected whitespace before "," in a multi-line list',
});

function rule(expectation, options, context) {
	const checker = whitespaceChecker('newline', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'always-multi-line', 'never-multi-line'],
		});

		if (!validOptions) {
			return;
		}

		let fixData;

		selectorListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.beforeAllowingIndentation,
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

						if (expectation.startsWith('always')) {
							const spaceIndex = beforeSelector.search(/\s+$/);

							if (spaceIndex >= 0) {
								beforeSelector =
									beforeSelector.slice(0, spaceIndex) +
									context.newline +
									beforeSelector.slice(spaceIndex);
							} else {
								beforeSelector += context.newline;
							}
						} else if (expectation === 'never-multi-line') {
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
