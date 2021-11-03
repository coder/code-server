// @ts-nocheck

'use strict';

const _ = require('lodash');
const eachDeclarationBlock = require('../../utils/eachDeclarationBlock');
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const shorthandData = require('../../reference/shorthandData');
const validateOptions = require('../../utils/validateOptions');
const vendor = require('../../utils/vendor');

const ruleName = 'declaration-block-no-redundant-longhand-properties';

const messages = ruleMessages(ruleName, {
	expected: (props) => `Expected shorthand property "${props}"`,
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
					ignoreShorthands: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		const longhandProperties = _.transform(shorthandData, (longhandProps, values, key) => {
			if (optionsMatches(options, 'ignoreShorthands', key)) {
				return;
			}

			values.forEach((value) => {
				(longhandProps[value] || (longhandProps[value] = [])).push(key);
			});
		});

		eachDeclarationBlock(root, (eachDecl) => {
			const longhandDeclarations = {};

			eachDecl((decl) => {
				const prop = decl.prop.toLowerCase();
				const unprefixedProp = vendor.unprefixed(prop);
				const prefix = vendor.prefix(prop);

				const shorthandProperties = longhandProperties[unprefixedProp];

				if (!shorthandProperties) {
					return;
				}

				shorthandProperties.forEach((shorthandProperty) => {
					const prefixedShorthandProperty = prefix + shorthandProperty;

					if (!longhandDeclarations[prefixedShorthandProperty]) {
						longhandDeclarations[prefixedShorthandProperty] = [];
					}

					longhandDeclarations[prefixedShorthandProperty].push(prop);

					const prefixedShorthandData = shorthandData[shorthandProperty].map((item) => {
						return prefix + item;
					});

					if (
						!_.isEqual(
							prefixedShorthandData.sort(),
							longhandDeclarations[prefixedShorthandProperty].sort(),
						)
					) {
						return;
					}

					report({
						ruleName,
						result,
						node: decl,
						message: messages.expected(prefixedShorthandProperty),
					});
				});
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
