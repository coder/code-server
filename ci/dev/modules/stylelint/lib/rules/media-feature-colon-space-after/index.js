// @ts-nocheck

'use strict';

const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const mediaFeatureColonSpaceChecker = require('../mediaFeatureColonSpaceChecker');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'media-feature-colon-space-after';

const messages = ruleMessages(ruleName, {
	expectedAfter: () => 'Expected single space after ":"',
	rejectedAfter: () => 'Unexpected whitespace after ":"',
});

function rule(expectation, options, context) {
	const checker = whitespaceChecker('space', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never'],
		});

		if (!validOptions) {
			return;
		}

		let fixData;

		mediaFeatureColonSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: context.fix
				? (atRule, index) => {
						const paramColonIndex = index - atRuleParamIndex(atRule);

						fixData = fixData || new Map();
						const colonIndices = fixData.get(atRule) || [];

						colonIndices.push(paramColonIndex);
						fixData.set(atRule, colonIndices);

						return true;
				  }
				: null,
		});

		if (fixData) {
			fixData.forEach((colonIndices, atRule) => {
				let params = atRule.raws.params ? atRule.raws.params.raw : atRule.params;

				colonIndices
					.sort((a, b) => b - a)
					.forEach((index) => {
						const beforeColon = params.slice(0, index + 1);
						const afterColon = params.slice(index + 1);

						if (expectation === 'always') {
							params = beforeColon + afterColon.replace(/^\s*/, ' ');
						} else if (expectation === 'never') {
							params = beforeColon + afterColon.replace(/^\s*/, '');
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
