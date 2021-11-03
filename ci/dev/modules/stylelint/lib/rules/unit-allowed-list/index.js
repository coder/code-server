// @ts-nocheck

'use strict';

const _ = require('lodash');
const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const getUnitFromValueNode = require('../../utils/getUnitFromValueNode');
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateObjectWithArrayProps = require('../../utils/validateObjectWithArrayProps');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'unit-allowed-list';

const messages = ruleMessages(ruleName, {
	rejected: (unit) => `Unexpected unit "${unit}"`,
});

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
				},
			},
		);

		if (!validOptions) {
			return;
		}

		function check(node, value, getIndex) {
			// make sure multiplication operations (*) are divided - not handled
			// by postcss-value-parser
			value = value.replace(/\*/g, ',');
			valueParser(value).walk((valueNode) => {
				// Ignore wrong units within `url` function
				if (valueNode.type === 'function' && valueNode.value.toLowerCase() === 'url') {
					return false;
				}

				const unit = getUnitFromValueNode(valueNode);

				if (!unit || (unit && list.includes(unit.toLowerCase()))) {
					return;
				}

				if (options && optionsMatches(options.ignoreProperties, unit.toLowerCase(), node.prop)) {
					return;
				}

				report({
					index: getIndex(node) + valueNode.sourceIndex,
					message: messages.rejected(unit),
					node,
					result,
					ruleName,
				});
			});
		}

		root.walkAtRules(/^media$/i, (atRule) => check(atRule, atRule.params, atRuleParamIndex));
		root.walkDecls((decl) => check(decl, decl.value, declarationValueIndex));
	};
}

rule.primaryOptionArray = true;

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
