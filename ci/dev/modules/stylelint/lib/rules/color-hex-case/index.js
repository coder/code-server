// @ts-nocheck

'use strict';

const valueParser = require('postcss-value-parser');

const declarationValueIndex = require('../../utils/declarationValueIndex');
const getDeclarationValue = require('../../utils/getDeclarationValue');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const setDeclarationValue = require('../../utils/setDeclarationValue');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'color-hex-case';

const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
});

const HEX = /^#[0-9A-Za-z]+/;
const IGNORED_FUNCTIONS = new Set(['url']);

function rule(expectation, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['lower', 'upper'],
		});

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			const parsedValue = valueParser(getDeclarationValue(decl));
			let needsFix = false;

			parsedValue.walk((node) => {
				const { value } = node;

				if (isIgnoredFunction(node)) return false;

				if (!isHexColor(node)) return;

				const expected = expectation === 'lower' ? value.toLowerCase() : value.toUpperCase();

				if (value === expected) return;

				if (context.fix) {
					node.value = expected;
					needsFix = true;

					return;
				}

				report({
					message: messages.expected(value, expected),
					node: decl,
					index: declarationValueIndex(decl) + node.sourceIndex,
					result,
					ruleName,
				});
			});

			if (needsFix) {
				setDeclarationValue(decl, parsedValue.toString());
			}
		});
	};
}

function isIgnoredFunction({ type, value }) {
	return type === 'function' && IGNORED_FUNCTIONS.has(value.toLowerCase());
}

function isHexColor({ type, value }) {
	return type === 'word' && HEX.test(value);
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
