// @ts-nocheck

'use strict';

const valueParser = require('postcss-value-parser');

const declarationValueIndex = require('../../utils/declarationValueIndex');
const getDeclarationValue = require('../../utils/getDeclarationValue');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const setDeclarationValue = require('../../utils/setDeclarationValue');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'color-hex-length';

const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
});

const HEX = /^#[0-9A-Za-z]+/;
const IGNORED_FUNCTIONS = new Set(['url']);

function rule(expectation, _, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['short', 'long'],
		});

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			const parsedValue = valueParser(getDeclarationValue(decl));
			let needsFix = false;

			parsedValue.walk((node) => {
				const { value: hexValue } = node;

				if (isIgnoredFunction(node)) return false;

				if (!isHexColor(node)) return;

				if (expectation === 'long' && hexValue.length !== 4 && hexValue.length !== 5) {
					return;
				}

				if (expectation === 'short' && (hexValue.length < 6 || !canShrink(hexValue))) {
					return;
				}

				const variant = expectation === 'long' ? longer : shorter;
				const expectedHex = variant(hexValue);

				if (context.fix) {
					node.value = expectedHex;
					needsFix = true;

					return;
				}

				report({
					message: messages.expected(hexValue, expectedHex),
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

function canShrink(hex) {
	hex = hex.toLowerCase();

	return (
		hex[1] === hex[2] &&
		hex[3] === hex[4] &&
		hex[5] === hex[6] &&
		(hex.length === 7 || (hex.length === 9 && hex[7] === hex[8]))
	);
}

function shorter(hex) {
	let hexVariant = '#';

	for (let i = 1; i < hex.length; i += 2) {
		hexVariant += hex[i];
	}

	return hexVariant;
}

function longer(hex) {
	let hexVariant = '#';

	for (let i = 1; i < hex.length; i++) {
		hexVariant += hex[i] + hex[i];
	}

	return hexVariant;
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
