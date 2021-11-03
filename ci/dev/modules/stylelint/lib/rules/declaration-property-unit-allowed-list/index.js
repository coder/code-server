// @ts-nocheck

'use strict';

const _ = require('lodash');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const getUnitFromValueNode = require('../../utils/getUnitFromValueNode');
const matchesStringOrRegExp = require('../../utils/matchesStringOrRegExp');
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');
const vendor = require('../../utils/vendor');

const ruleName = 'declaration-property-unit-allowed-list';

const messages = ruleMessages(ruleName, {
	rejected: (property, unit) => `Unexpected unit "${unit}" for property "${property}"`,
});

function rule(list, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: list,
				possible: [_.isObject],
			},
			{
				actual: options,
				possible: {
					ignore: ['inside-function'],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			const prop = decl.prop;
			const value = decl.value;

			const unprefixedProp = vendor.unprefixed(prop);

			const propList = _.find(list, (units, propIdentifier) =>
				matchesStringOrRegExp(unprefixedProp, propIdentifier),
			);

			if (!propList) {
				return;
			}

			valueParser(value).walk((node) => {
				// Ignore wrong units within `url` function
				if (node.type === 'function') {
					if (node.value.toLowerCase() === 'url') {
						return false;
					}

					if (optionsMatches(options, 'ignore', 'inside-function')) {
						return false;
					}
				}

				if (node.type === 'string') {
					return;
				}

				const unit = getUnitFromValueNode(node);

				if (!unit || (unit && propList.indexOf(unit.toLowerCase())) !== -1) {
					return;
				}

				report({
					message: messages.rejected(prop, unit),
					node: decl,
					index: declarationValueIndex(decl) + node.sourceIndex,
					result,
					ruleName,
				});
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
