// @ts-nocheck

'use strict';

const eachDeclarationBlock = require('../../utils/eachDeclarationBlock');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const shorthandData = require('../../reference/shorthandData');
const validateOptions = require('../../utils/validateOptions');
const vendor = require('../../utils/vendor');

const ruleName = 'declaration-block-no-shorthand-property-overrides';

const messages = ruleMessages(ruleName, {
	rejected: (shorthand, original) => `Unexpected shorthand "${shorthand}" after "${original}"`,
});

function rule(actual) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		eachDeclarationBlock(root, (eachDecl) => {
			const declarations = {};

			eachDecl((decl) => {
				const prop = decl.prop;
				const unprefixedProp = vendor.unprefixed(prop);
				const prefix = vendor.prefix(prop).toLowerCase();

				const overrideables = shorthandData[unprefixedProp.toLowerCase()];

				if (!overrideables) {
					declarations[prop.toLowerCase()] = prop;

					return;
				}

				overrideables.forEach((longhandProp) => {
					if (!Object.prototype.hasOwnProperty.call(declarations, prefix + longhandProp)) {
						return;
					}

					report({
						ruleName,
						result,
						node: decl,
						message: messages.rejected(prop, declarations[prefix + longhandProp]),
					});
				});
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
