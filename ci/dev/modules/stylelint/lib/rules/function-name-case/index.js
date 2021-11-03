// @ts-nocheck

'use strict';

const _ = require('lodash');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const getDeclarationValue = require('../../utils/getDeclarationValue');
const isStandardSyntaxFunction = require('../../utils/isStandardSyntaxFunction');
const keywordSets = require('../../reference/keywordSets');
const matchesStringOrRegExp = require('../../utils/matchesStringOrRegExp');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const setDeclarationValue = require('../../utils/setDeclarationValue');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'function-name-case';

const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
});

const mapLowercaseFunctionNamesToCamelCase = new Map();

keywordSets.camelCaseFunctionNames.forEach((func) => {
	mapLowercaseFunctionNamesToCamelCase.set(func.toLowerCase(), func);
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
					ignoreFunctions: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			let needFix = false;
			const parsed = valueParser(getDeclarationValue(decl));

			parsed.walk((node) => {
				if (node.type !== 'function' || !isStandardSyntaxFunction(node)) {
					return;
				}

				const functionName = node.value;
				const functionNameLowerCase = functionName.toLowerCase();

				const ignoreFunctions = (options && options.ignoreFunctions) || [];

				if (ignoreFunctions.length > 0 && matchesStringOrRegExp(functionName, ignoreFunctions)) {
					return;
				}

				let expectedFunctionName = null;

				if (
					expectation === 'lower' &&
					mapLowercaseFunctionNamesToCamelCase.has(functionNameLowerCase)
				) {
					expectedFunctionName = mapLowercaseFunctionNamesToCamelCase.get(functionNameLowerCase);
				} else if (expectation === 'lower') {
					expectedFunctionName = functionNameLowerCase;
				} else {
					expectedFunctionName = functionName.toUpperCase();
				}

				if (functionName === expectedFunctionName) {
					return;
				}

				if (context.fix) {
					needFix = true;
					node.value = expectedFunctionName;

					return;
				}

				report({
					message: messages.expected(functionName, expectedFunctionName),
					node: decl,
					index: declarationValueIndex(decl) + node.sourceIndex,
					result,
					ruleName,
				});
			});

			if (context.fix && needFix) {
				setDeclarationValue(decl, parsed.toString());
			}
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
