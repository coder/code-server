// @ts-nocheck

'use strict';

const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const mediaQueryListCommaWhitespaceChecker = require('../mediaQueryListCommaWhitespaceChecker');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'media-query-list-comma-space-before';

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

		mediaQueryListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			fix: context.fix
				? (atRule, index) => {
						const paramCommaIndex = index - atRuleParamIndex(atRule);

						fixData = fixData || new Map();
						const commaIndices = fixData.get(atRule) || [];

						commaIndices.push(paramCommaIndex);
						fixData.set(atRule, commaIndices);

						return true;
				  }
				: null,
		});

		if (fixData) {
			fixData.forEach((commaIndices, atRule) => {
				let params = atRule.raws.params ? atRule.raws.params.raw : atRule.params;

				commaIndices
					.sort((a, b) => b - a)
					.forEach((index) => {
						const beforeComma = params.slice(0, index);
						const afterComma = params.slice(index);

						if (expectation.startsWith('always')) {
							params = beforeComma.replace(/\s*$/, ' ') + afterComma;
						} else if (expectation.startsWith('never')) {
							params = beforeComma.replace(/\s*$/, '') + afterComma;
						}
					});

				if (atRule.raws.params) {
					atRule.raws.params.raw = params;
				} else {
					atRule.params = params;
				}
			});
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
