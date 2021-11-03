// @ts-nocheck

'use strict';

const _ = require('lodash');
const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const isCustomMediaQuery = require('../../utils/isCustomMediaQuery');
const isRangeContextMediaFeature = require('../../utils/isRangeContextMediaFeature');
const isStandardSyntaxMediaFeatureName = require('../../utils/isStandardSyntaxMediaFeatureName');
const keywordSets = require('../../reference/keywordSets');
const mediaParser = require('postcss-media-query-parser').default;
const optionsMatches = require('../../utils/optionsMatches');
const rangeContextNodeParser = require('../rangeContextNodeParser');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const vendor = require('../../utils/vendor');

const ruleName = 'media-feature-name-no-unknown';

const messages = ruleMessages(ruleName, {
	rejected: (mediaFeatureName) => `Unexpected unknown media feature name "${mediaFeatureName}"`,
});

function rule(actual, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{ actual },
			{
				actual: options,
				possible: {
					ignoreMediaFeatureNames: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkAtRules(/^media$/i, (atRule) => {
			mediaParser(atRule.params).walk(/^media-feature$/i, (mediaFeatureNode) => {
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

				if (optionsMatches(options, 'ignoreMediaFeatureNames', value)) {
					return;
				}

				if (vendor.prefix(value) || keywordSets.mediaFeatureNames.has(value.toLowerCase())) {
					return;
				}

				report({
					index: atRuleParamIndex(atRule) + sourceIndex,
					message: messages.rejected(value),
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
