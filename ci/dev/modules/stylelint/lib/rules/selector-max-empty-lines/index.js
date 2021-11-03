// @ts-nocheck

'use strict';

const _ = require('lodash');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'selector-max-empty-lines';

const messages = ruleMessages(ruleName, {
	expected: (max) => `Expected no more than ${max} empty ${max === 1 ? 'line' : 'lines'}`,
});

function rule(max, options, context) {
	const maxAdjacentNewlines = max + 1;

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: max,
			possible: _.isNumber,
		});

		if (!validOptions) {
			return;
		}

		const violatedCRLFNewLinesRegex = new RegExp(`(?:\r\n){${maxAdjacentNewlines + 1},}`);
		const violatedLFNewLinesRegex = new RegExp(`\n{${maxAdjacentNewlines + 1},}`);
		const allowedLFNewLinesString = context.fix ? '\n'.repeat(maxAdjacentNewlines) : '';
		const allowedCRLFNewLinesString = context.fix ? '\r\n'.repeat(maxAdjacentNewlines) : '';

		root.walkRules((ruleNode) => {
			const selector = ruleNode.raws.selector ? ruleNode.raws.selector.raw : ruleNode.selector;

			if (context.fix) {
				const newSelectorString = selector
					.replace(new RegExp(violatedLFNewLinesRegex, 'gm'), allowedLFNewLinesString)
					.replace(new RegExp(violatedCRLFNewLinesRegex, 'gm'), allowedCRLFNewLinesString);

				if (ruleNode.raws.selector) {
					ruleNode.raws.selector.raw = newSelectorString;
				} else {
					ruleNode.selector = newSelectorString;
				}
			} else if (
				violatedLFNewLinesRegex.test(selector) ||
				violatedCRLFNewLinesRegex.test(selector)
			) {
				report({
					message: messages.expected(max),
					node: ruleNode,
					index: 0,
					result,
					ruleName,
				});
			}
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
