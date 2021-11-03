// @ts-nocheck

'use strict';

const _ = require('lodash');
const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const getUnitFromValueNode = require('../../utils/getUnitFromValueNode');
const mediaParser = require('postcss-media-query-parser').default;
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateObjectWithArrayProps = require('../../utils/validateObjectWithArrayProps');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'unit-blacklist';

const messages = ruleMessages(ruleName, {
	rejected: (unit) => `Unexpected unit "${unit}"`,
});

// a function to retrieve only the media feature name
// could be externalized in an utils function if needed in other code
const getMediaFeatureName = (mediaFeatureNode) => {
	const value = mediaFeatureNode.value.toLowerCase();

	return /((-?\w*)*)/i.exec(value)[1];
};

function rule(listInput, options) {
	const list = [].concat(listInput);

	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: list,
				possible: [_.isString],
			},
			{
				optional: true,
				actual: options,
				possible: {
					ignoreProperties: validateObjectWithArrayProps([_.isString, _.isRegExp]),
					ignoreMediaFeatureNames: validateObjectWithArrayProps([_.isString, _.isRegExp]),
				},
			},
		);

		if (!validOptions) {
			return;
		}

		result.warn(`'${ruleName}' has been deprecated. Instead use 'unit-disallowed-list'.`, {
			stylelintType: 'deprecation',
			stylelintReference: `https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/${ruleName}/README.md`,
		});

		function check(node, nodeIndex, valueNode, input, option) {
			const unit = getUnitFromValueNode(valueNode);

			// There is not unit or it is not configured as a violation
			if (!unit || (unit && !list.includes(unit.toLowerCase()))) {
				return;
			}

			// The unit has an ignore option for the specific input
			if (optionsMatches(option, unit.toLowerCase(), input)) {
				return;
			}

			report({
				index: nodeIndex + valueNode.sourceIndex,
				message: messages.rejected(unit),
				node,
				result,
				ruleName,
			});
		}

		function checkMedia(node, value, getIndex) {
			mediaParser(node.params).walk(/^media-feature$/i, (mediaFeatureNode) => {
				const mediaName = getMediaFeatureName(mediaFeatureNode);
				const parentValue = mediaFeatureNode.parent.value;

				valueParser(value).walk((valueNode) => {
					// Ignore all non-word valueNode and
					// the values not included in the parentValue string
					if (valueNode.type !== 'word' || !parentValue.includes(valueNode.value)) {
						return;
					}

					check(
						node,
						getIndex(node),
						valueNode,
						mediaName,
						options ? options.ignoreMediaFeatureNames : {},
					);
				});
			});
		}

		function checkDecl(node, value, getIndex) {
			// make sure multiplication operations (*) are divided - not handled
			// by postcss-value-parser
			value = value.replace(/\*/g, ',');

			valueParser(value).walk((valueNode) => {
				// Ignore wrong units within `url` function
				if (valueNode.type === 'function' && valueNode.value.toLowerCase() === 'url') {
					return false;
				}

				check(node, getIndex(node), valueNode, node.prop, options ? options.ignoreProperties : {});
			});
		}

		root.walkAtRules(/^media$/i, (atRule) => checkMedia(atRule, atRule.params, atRuleParamIndex));
		root.walkDecls((decl) => checkDecl(decl, decl.value, declarationValueIndex));
	};
}

rule.primaryOptionArray = true;

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = { deprecated: true };

module.exports = rule;
