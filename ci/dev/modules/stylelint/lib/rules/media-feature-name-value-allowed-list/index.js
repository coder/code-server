// @ts-nocheck

'use strict';

const _ = require('lodash');
const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const isRangeContextMediaFeature = require('../../utils/isRangeContextMediaFeature');
const matchesStringOrRegExp = require('../../utils/matchesStringOrRegExp');
const mediaParser = require('postcss-media-query-parser').default;
const rangeContextNodeParser = require('../rangeContextNodeParser');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const vendor = require('../../utils/vendor');

const ruleName = 'media-feature-name-value-allowed-list';

const messages = ruleMessages(ruleName, {
	rejected: (name, value) => `Unexpected value "${value}" for name "${name}"`,
});

function rule(list) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: list,
			possible: [_.isObject],
		});

		if (!validOptions) {
			return;
		}

		root.walkAtRules(/^media$/i, (atRule) => {
			mediaParser(atRule.params).walk(/^media-feature-expression$/i, (node) => {
				const mediaFeatureRangeContext = isRangeContextMediaFeature(node.parent.value);

				// Ignore boolean
				if (!node.value.includes(':') && !mediaFeatureRangeContext) {
					return;
				}

				const mediaFeatureNode = _.find(node.nodes, { type: 'media-feature' });

				let mediaFeatureName;
				let values = [];

				if (mediaFeatureRangeContext) {
					const parsedRangeContext = rangeContextNodeParser(mediaFeatureNode);

					mediaFeatureName = parsedRangeContext.name.value;
					values = parsedRangeContext.values;
				} else {
					mediaFeatureName = mediaFeatureNode.value;
					values.push(_.find(node.nodes, { type: 'value' }));
				}

				for (let i = 0; i < values.length; i++) {
					const valueNode = values[i];
					const value = valueNode.value;
					const unprefixedMediaFeatureName = vendor.unprefixed(mediaFeatureName);

					const allowedValues = _.find(list, (v, featureName) =>
						matchesStringOrRegExp(unprefixedMediaFeatureName, featureName),
					);

					if (allowedValues === undefined) {
						return;
					}

					if (matchesStringOrRegExp(value, allowedValues)) {
						return;
					}

					report({
						index: atRuleParamIndex(atRule) + valueNode.sourceIndex,
						message: messages.rejected(mediaFeatureName, value),
						node: atRule,
						ruleName,
						result,
					});
				}
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
