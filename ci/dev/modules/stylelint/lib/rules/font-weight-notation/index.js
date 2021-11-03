// @ts-nocheck

'use strict';

const declarationValueIndex = require('../../utils/declarationValueIndex');
const isNumbery = require('../../utils/isNumbery');
const isStandardSyntaxValue = require('../../utils/isStandardSyntaxValue');
const isVariable = require('../../utils/isVariable');
const keywordSets = require('../../reference/keywordSets');
const optionsMatches = require('../../utils/optionsMatches');
const postcss = require('postcss');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'font-weight-notation';

const messages = ruleMessages(ruleName, {
	expected: (type) => `Expected ${type} font-weight notation`,
	invalidNamed: (name) => `Unexpected invalid font-weight name "${name}"`,
});

const INHERIT_KEYWORD = 'inherit';
const INITIAL_KEYWORD = 'initial';
const NORMAL_KEYWORD = 'normal';
const WEIGHTS_WITH_KEYWORD_EQUIVALENTS = new Set(['400', '700']);

function rule(expectation, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: expectation,
				possible: ['numeric', 'named-where-possible'],
			},
			{
				actual: options,
				possible: {
					ignore: ['relative'],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			if (decl.prop.toLowerCase() === 'font-weight') {
				checkWeight(decl.value, decl);
			}

			if (decl.prop.toLowerCase() === 'font') {
				checkFont(decl);
			}
		});

		function checkFont(decl) {
			const valueList = postcss.list.space(decl.value);
			// We do not need to more carefully distinguish font-weight
			// numbers from unitless line-heights because line-heights in
			// `font` values need to be part of a font-size/line-height pair
			const hasNumericFontWeight = valueList.some(isNumbery);

			for (const value of postcss.list.space(decl.value)) {
				if (
					(value.toLowerCase() === NORMAL_KEYWORD && !hasNumericFontWeight) ||
					isNumbery(value) ||
					(value.toLowerCase() !== NORMAL_KEYWORD &&
						keywordSets.fontWeightKeywords.has(value.toLowerCase()))
				) {
					checkWeight(value, decl);

					return;
				}
			}
		}

		function checkWeight(weightValue, decl) {
			if (!isStandardSyntaxValue(weightValue)) {
				return;
			}

			if (isVariable(weightValue)) {
				return;
			}

			if (
				weightValue.toLowerCase() === INHERIT_KEYWORD ||
				weightValue.toLowerCase() === INITIAL_KEYWORD
			) {
				return;
			}

			if (
				optionsMatches(options, 'ignore', 'relative') &&
				keywordSets.fontWeightRelativeKeywords.has(weightValue.toLowerCase())
			) {
				return;
			}

			const weightValueOffset = decl.value.indexOf(weightValue);

			if (expectation === 'numeric') {
				if (decl.parent.type === 'atrule' && decl.parent.name.toLowerCase() === 'font-face') {
					const weightValueNumbers = postcss.list.space(weightValue);

					if (!weightValueNumbers.every(isNumbery)) {
						return complain(messages.expected('numeric'));
					}

					return;
				}

				if (!isNumbery(weightValue)) {
					return complain(messages.expected('numeric'));
				}
			}

			if (expectation === 'named-where-possible') {
				if (isNumbery(weightValue)) {
					if (WEIGHTS_WITH_KEYWORD_EQUIVALENTS.has(weightValue)) {
						complain(messages.expected('named'));
					}

					return;
				}

				if (
					!keywordSets.fontWeightKeywords.has(weightValue.toLowerCase()) &&
					weightValue.toLowerCase() !== NORMAL_KEYWORD
				) {
					return complain(messages.invalidNamed(weightValue));
				}
			}

			function complain(message) {
				report({
					ruleName,
					result,
					message,
					node: decl,
					index: declarationValueIndex(decl) + weightValueOffset,
				});
			}
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
