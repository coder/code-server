// @ts-nocheck

'use strict';

const declarationValueIndex = require('../../utils/declarationValueIndex');
const findFontFamily = require('../../utils/findFontFamily');
const isStandardSyntaxValue = require('../../utils/isStandardSyntaxValue');
const isVariable = require('../../utils/isVariable');
const keywordSets = require('../../reference/keywordSets');
const optionsMatches = require('../../utils/optionsMatches');
const postcss = require('postcss');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const _ = require('lodash');

const ruleName = 'font-family-no-missing-generic-family-keyword';

const messages = ruleMessages(ruleName, {
	rejected: 'Unexpected missing generic font family',
});

const isFamilyNameKeyword = (node) =>
	!node.quote && keywordSets.fontFamilyKeywords.has(node.value.toLowerCase());

const isLastFontFamilyVariable = (value) => {
	const lastValue = postcss.list.comma(value).pop();

	return isVariable(lastValue) || !isStandardSyntaxValue(lastValue);
};

function rule(actual, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{ actual },
			{
				actual: options,
				possible: {
					ignoreFontFamilies: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkDecls(/^font(-family)?$/i, (decl) => {
			// Ignore @font-face
			if (
				decl.parent &&
				decl.parent.type === 'atrule' &&
				decl.parent.name.toLowerCase() === 'font-face'
			) {
				return;
			}

			if (decl.prop === 'font' && keywordSets.systemFontValues.has(decl.value.toLowerCase())) {
				return;
			}

			if (isLastFontFamilyVariable(decl.value)) {
				return;
			}

			const fontFamilies = findFontFamily(decl.value);

			if (fontFamilies.length === 0) {
				return;
			}

			if (fontFamilies.some(isFamilyNameKeyword)) {
				return;
			}

			if (fontFamilies.some((node) => optionsMatches(options, 'ignoreFontFamilies', node.value))) {
				return;
			}

			report({
				result,
				ruleName,
				message: messages.rejected,
				node: decl,
				index: declarationValueIndex(decl) + fontFamilies[fontFamilies.length - 1].sourceIndex,
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
