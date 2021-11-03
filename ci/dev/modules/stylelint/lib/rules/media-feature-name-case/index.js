// @ts-nocheck

'use strict';

const _ = require('lodash');
const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const isCustomMediaQuery = require('../../utils/isCustomMediaQuery');
const isRangeContextMediaFeature = require('../../utils/isRangeContextMediaFeature');
const isStandardSyntaxMediaFeatureName = require('../../utils/isStandardSyntaxMediaFeatureName');
const mediaParser = require('postcss-media-query-parser').default;
const rangeContextNodeParser = require('../rangeContextNodeParser');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'media-feature-name-case';

const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
});

function rule(expectation, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['lower', 'upper'],
		});

		if (!validOptions) {
			return;
		}

		root.walkAtRules(/^media$/i, (atRule) => {
			let hasComments = _.get(atRule, 'raws.params.raw');
			const mediaRule = hasComments ? hasComments : atRule.params;

			mediaParser(mediaRule).walk(/^media-feature$/i, (mediaFeatureNode) => {
				const parent = mediaFeatureNode.parent;
				const mediaFeatureRangeContext = isRangeContextMediaFeature(parent.value);

				let value;
				let sourceIndex;

				if (mediaFeatureRangeContext) {
					const parsedRangeContext = rangeContextNodeParser(mediaFeatureNode);

					value = parsedRangeContext.name.value;
					sourceIndex = parsedRangeContext.name.sourceIndex;
				} else {
					value = mediaFeatureNode.value;
					sourceIndex = mediaFeatureNode.sourceIndex;
				}

				if (!isStandardSyntaxMediaFeatureName(value) || isCustomMediaQuery(value)) {
					return;
				}

				const expectedFeatureName =
					expectation === 'lower' ? value.toLowerCase() : value.toUpperCase();

				if (value === expectedFeatureName) {
					return;
				}

				if (context.fix) {
					if (hasComments) {
						hasComments =
							hasComments.slice(0, sourceIndex) +
							expectedFeatureName +
							hasComments.slice(sourceIndex + expectedFeatureName.length);
						_.set(atRule, 'raws.params.raw', hasComments);
					} else {
						atRule.params =
							atRule.params.slice(0, sourceIndex) +
							expectedFeatureName +
							atRule.params.slice(sourceIndex + expectedFeatureName.length);
					}

					return;
				}

				report({
					index: atRuleParamIndex(atRule) + sourceIndex,
					message: messages.expected(value, expectedFeatureName),
					node: atRule,
					ruleName,
					result,
				});
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
