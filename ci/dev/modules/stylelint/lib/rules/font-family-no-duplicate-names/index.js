// @ts-nocheck

'use strict';

const _ = require('lodash');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const findFontFamily = require('../../utils/findFontFamily');
const keywordSets = require('../../reference/keywordSets');
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'font-family-no-duplicate-names';

const messages = ruleMessages(ruleName, {
	rejected: (name) => `Unexpected duplicate name ${name}`,
});

const isFamilyNameKeyword = (node) =>
	!node.quote && keywordSets.fontFamilyKeywords.has(node.value.toLowerCase());

function rule(actual, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{ actual },
			{
				actual: options,
				possible: {
					ignoreFontFamilyNames: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkDecls(/^font(-family)?$/i, (decl) => {
			const keywords = new Set();
			const familyNames = new Set();

			const fontFamilies = findFontFamily(decl.value);

			if (fontFamilies.length === 0) {
				return;
			}

			fontFamilies.forEach((fontFamilyNode) => {
				const family = fontFamilyNode.value.trim();

				if (optionsMatches(options, 'ignoreFontFamilyNames', fontFamilyNode.value.trim())) {
					return;
				}

				if (isFamilyNameKeyword(fontFamilyNode)) {
					if (keywords.has(family.toLowerCase())) {
						complain(
							messages.rejected(family),
							declarationValueIndex(decl) + fontFamilyNode.sourceIndex,
							decl,
						);

						return;
					}

					keywords.add(family);

					return;
				}

				if (familyNames.has(family)) {
					complain(
						messages.rejected(family),
						declarationValueIndex(decl) + fontFamilyNode.sourceIndex,
						decl,
					);

					return;
				}

				familyNames.add(family);
			});
		});

		function complain(message, index, decl) {
			report({
				result,
				ruleName,
				message,
				node: decl,
				index,
			});
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
