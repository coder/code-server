// @ts-nocheck

'use strict';

const _ = require('lodash');
const eachDeclarationBlock = require('../../utils/eachDeclarationBlock');
const isCustomProperty = require('../../utils/isCustomProperty');
const isStandardSyntaxProperty = require('../../utils/isStandardSyntaxProperty');
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'declaration-block-no-duplicate-properties';

const messages = ruleMessages(ruleName, {
	rejected: (property) => `Unexpected duplicate "${property}"`,
});

function rule(on, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{ actual: on },
			{
				actual: options,
				possible: {
					ignore: ['consecutive-duplicates', 'consecutive-duplicates-with-different-values'],
					ignoreProperties: [_.isString],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		eachDeclarationBlock(root, (eachDecl) => {
			const decls = [];
			const values = [];

			eachDecl((decl) => {
				const prop = decl.prop;
				const value = decl.value;

				if (!isStandardSyntaxProperty(prop)) {
					return;
				}

				if (isCustomProperty(prop)) {
					return;
				}

				// Return early if the property is to be ignored
				if (optionsMatches(options, 'ignoreProperties', prop)) {
					return;
				}

				// Ignore the src property as commonly duplicated in at-fontface
				if (prop.toLowerCase() === 'src') {
					return;
				}

				const indexDuplicate = decls.indexOf(prop.toLowerCase());

				if (indexDuplicate !== -1) {
					if (optionsMatches(options, 'ignore', 'consecutive-duplicates-with-different-values')) {
						// if duplicates are not consecutive
						if (indexDuplicate !== decls.length - 1) {
							report({
								message: messages.rejected(prop),
								node: decl,
								result,
								ruleName,
							});

							return;
						}

						// if values of consecutive duplicates are equal
						if (value === values[indexDuplicate]) {
							report({
								message: messages.rejected(value),
								node: decl,
								result,
								ruleName,
							});

							return;
						}

						return;
					}

					if (
						optionsMatches(options, 'ignore', 'consecutive-duplicates') &&
						indexDuplicate === decls.length - 1
					) {
						return;
					}

					report({
						message: messages.rejected(prop),
						node: decl,
						result,
						ruleName,
					});
				}

				decls.push(prop.toLowerCase());
				values.push(value.toLowerCase());
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
