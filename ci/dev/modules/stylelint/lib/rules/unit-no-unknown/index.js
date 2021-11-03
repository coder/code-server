// @ts-nocheck

'use strict';

const _ = require('lodash');
const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const getUnitFromValueNode = require('../../utils/getUnitFromValueNode');
const isMap = require('../../utils/isMap');
const keywordSets = require('../../reference/keywordSets');
const mediaParser = require('postcss-media-query-parser').default;
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');
const vendor = require('../../utils/vendor');

const ruleName = 'unit-no-unknown';

const messages = ruleMessages(ruleName, {
	rejected: (unit) => `Unexpected unknown unit "${unit}"`,
});

// The map property name (in map cleared from comments and spaces) always
// has index that being divided by 4 gives remainder equals 0
const mapPropertyNameIndexOffset = 4;

function rule(actual, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{ actual },
			{
				actual: options,
				possible: {
					ignoreUnits: [_.isString, _.isRegExp],
					ignoreFunctions: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		function check(node, value, getIndex) {
			// make sure multiplication operations (*) are divided - not handled
			// by postcss-value-parser
			value = value.replace(/\*/g, ',');
			const parsedValue = valueParser(value);
			const ignoredMapProperties = [];

			parsedValue.walk((valueNode) => {
				// Ignore wrong units within `url` function
				// and within functions listed in the `ignoreFunctions` option
				if (
					valueNode.type === 'function' &&
					(valueNode.value.toLowerCase() === 'url' ||
						optionsMatches(options, 'ignoreFunctions', valueNode.value))
				) {
					return false;
				}

				if (isMap(valueNode)) {
					valueNode.nodes.forEach(({ sourceIndex }, index) => {
						if (!(index % mapPropertyNameIndexOffset)) {
							ignoredMapProperties.push(sourceIndex);
						}
					});
				}

				if (ignoredMapProperties.includes(valueNode.sourceIndex)) {
					return;
				}

				const unit = getUnitFromValueNode(valueNode);

				if (!unit) {
					return;
				}

				if (optionsMatches(options, 'ignoreUnits', unit)) {
					return;
				}

				if (keywordSets.units.has(unit.toLowerCase()) && unit.toLowerCase() !== 'x') {
					return;
				}

				if (unit.toLowerCase() === 'x') {
					if (
						node.type === 'atrule' &&
						node.name === 'media' &&
						node.params.toLowerCase().includes('resolution')
					) {
						let ignoreUnit = false;

						mediaParser(node.params).walk((mediaNode, i, mediaNodes) => {
							if (
								mediaNode.value.toLowerCase().includes('resolution') &&
								_.last(mediaNodes).sourceIndex === valueNode.sourceIndex
							) {
								ignoreUnit = true;

								return false;
							}
						});

						if (ignoreUnit) {
							return;
						}
					}

					if (node.type === 'decl') {
						if (node.prop.toLowerCase() === 'image-resolution') {
							return;
						}

						if (/^(?:-webkit-)?image-set[\s(]/i.test(value)) {
							const imageSet = parsedValue.nodes.find(
								(n) => vendor.unprefixed(n.value) === 'image-set',
							);
							const imageSetValueLastIndex = _.last(imageSet.nodes).sourceIndex;

							if (imageSetValueLastIndex >= valueNode.sourceIndex) {
								return;
							}
						}
					}
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

		root.walkAtRules((atRule) => {
			if (!/^media$/i.test(atRule.name) && !atRule.variable) {
				return;
			}

			check(atRule, atRule.params, atRuleParamIndex);
		});
		root.walkDecls((decl) => check(decl, decl.value, declarationValueIndex));
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
