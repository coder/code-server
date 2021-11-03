// @ts-nocheck

'use strict';

const _ = require('lodash');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const getDeclarationValue = require('../../utils/getDeclarationValue');
const getUnitFromValueNode = require('../../utils/getUnitFromValueNode');
const isCounterIncrementCustomIdentValue = require('../../utils/isCounterIncrementCustomIdentValue');
const isCounterResetCustomIdentValue = require('../../utils/isCounterResetCustomIdentValue');
const isStandardSyntaxValue = require('../../utils/isStandardSyntaxValue');
const keywordSets = require('../../reference/keywordSets');
const matchesStringOrRegExp = require('../../utils/matchesStringOrRegExp');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'value-keyword-case';

const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
});

// Operators are interpreted as "words" by the value parser, so we want to make sure to ignore them.
const ignoredCharacters = new Set(['+', '-', '/', '*', '%']);
const gridRowProps = new Set(['grid-row', 'grid-row-start', 'grid-row-end']);
const gridColumnProps = new Set(['grid-column', 'grid-column-start', 'grid-column-end']);

const mapLowercaseKeywordsToCamelCase = new Map();

keywordSets.camelCaseKeywords.forEach((func) => {
	mapLowercaseKeywordsToCamelCase.set(func.toLowerCase(), func);
});

function rule(expectation, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: expectation,
				possible: ['lower', 'upper'],
			},
			{
				actual: options,
				possible: {
					ignoreProperties: [_.isString, _.isRegExp],
					ignoreKeywords: [_.isString, _.isRegExp],
					ignoreFunctions: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			const prop = decl.prop;
			const propLowerCase = decl.prop.toLowerCase();
			const value = decl.value;

			const parsed = valueParser(getDeclarationValue(decl));

			let needFix = false;

			parsed.walk((node) => {
				const valueLowerCase = node.value.toLowerCase();

				// Ignore system colors
				if (keywordSets.systemColors.has(valueLowerCase)) {
					return;
				}

				// Ignore keywords within `url` and `var` function
				if (
					node.type === 'function' &&
					(valueLowerCase === 'url' ||
						valueLowerCase === 'var' ||
						valueLowerCase === 'counter' ||
						valueLowerCase === 'counters' ||
						valueLowerCase === 'attr')
				) {
					return false;
				}

				// ignore keywords within ignoreFunctions functions

				const ignoreFunctions = (options && options.ignoreFunctions) || [];

				if (
					node.type === 'function' &&
					ignoreFunctions.length > 0 &&
					matchesStringOrRegExp(valueLowerCase, ignoreFunctions)
				) {
					return false;
				}

				const keyword = node.value;

				// Ignore css variables, and hex values, and math operators, and sass interpolation
				if (
					node.type !== 'word' ||
					!isStandardSyntaxValue(node.value) ||
					value.includes('#') ||
					ignoredCharacters.has(keyword) ||
					getUnitFromValueNode(node)
				) {
					return;
				}

				if (
					propLowerCase === 'animation' &&
					!keywordSets.animationShorthandKeywords.has(valueLowerCase) &&
					!keywordSets.animationNameKeywords.has(valueLowerCase)
				) {
					return;
				}

				if (
					propLowerCase === 'animation-name' &&
					!keywordSets.animationNameKeywords.has(valueLowerCase)
				) {
					return;
				}

				if (
					propLowerCase === 'font' &&
					!keywordSets.fontShorthandKeywords.has(valueLowerCase) &&
					!keywordSets.fontFamilyKeywords.has(valueLowerCase)
				) {
					return;
				}

				if (
					propLowerCase === 'font-family' &&
					!keywordSets.fontFamilyKeywords.has(valueLowerCase)
				) {
					return;
				}

				if (
					propLowerCase === 'counter-increment' &&
					isCounterIncrementCustomIdentValue(valueLowerCase)
				) {
					return;
				}

				if (propLowerCase === 'counter-reset' && isCounterResetCustomIdentValue(valueLowerCase)) {
					return;
				}

				if (gridRowProps.has(propLowerCase) && !keywordSets.gridRowKeywords.has(valueLowerCase)) {
					return;
				}

				if (
					gridColumnProps.has(propLowerCase) &&
					!keywordSets.gridColumnKeywords.has(valueLowerCase)
				) {
					return;
				}

				if (propLowerCase === 'grid-area' && !keywordSets.gridAreaKeywords.has(valueLowerCase)) {
					return;
				}

				if (
					propLowerCase === 'list-style' &&
					!keywordSets.listStyleShorthandKeywords.has(valueLowerCase) &&
					!keywordSets.listStyleTypeKeywords.has(valueLowerCase)
				) {
					return;
				}

				if (
					propLowerCase === 'list-style-type' &&
					!keywordSets.listStyleTypeKeywords.has(valueLowerCase)
				) {
					return;
				}

				const ignoreKeywords = (options && options.ignoreKeywords) || [];
				const ignoreProperties = (options && options.ignoreProperties) || [];

				if (ignoreKeywords.length > 0 && matchesStringOrRegExp(keyword, ignoreKeywords)) {
					return;
				}

				if (ignoreProperties.length > 0 && matchesStringOrRegExp(prop, ignoreProperties)) {
					return;
				}

				const keywordLowerCase = keyword.toLocaleLowerCase();
				let expectedKeyword = null;

				if (expectation === 'lower' && mapLowercaseKeywordsToCamelCase.has(keywordLowerCase)) {
					expectedKeyword = mapLowercaseKeywordsToCamelCase.get(keywordLowerCase);
				} else if (expectation === 'lower') {
					expectedKeyword = keyword.toLowerCase();
				} else {
					expectedKeyword = keyword.toUpperCase();
				}

				if (keyword === expectedKeyword) {
					return;
				}

				if (context.fix) {
					needFix = true;
					node.value = expectedKeyword;

					return;
				}

				report({
					message: messages.expected(keyword, expectedKeyword),
					node: decl,
					index: declarationValueIndex(decl) + node.sourceIndex,
					result,
					ruleName,
				});
			});

			if (context.fix && needFix) {
				decl.value = parsed.toString();
			}
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
