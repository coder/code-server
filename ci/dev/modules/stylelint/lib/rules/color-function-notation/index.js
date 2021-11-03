// @ts-nocheck

'use strict';

const valueParser = require('postcss-value-parser');

const declarationValueIndex = require('../../utils/declarationValueIndex');
const getDeclarationValue = require('../../utils/getDeclarationValue');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const setDeclarationValue = require('../../utils/setDeclarationValue');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'color-function-notation';

const messages = ruleMessages(ruleName, {
	expected: (primary) => `Expected ${primary} color-function notation`,
});

const LEGACY_FUNCS = new Set(['rgba', 'hsla']);
const LEGACY_NOTATION_FUNCS = new Set(['rgb', 'rgba', 'hsl', 'hsla']);

function rule(primary, secondary, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: ['modern', 'legacy'],
		});

		if (!validOptions) return;

		root.walkDecls((decl) => {
			let needsFix = false;
			const parsedValue = valueParser(getDeclarationValue(decl));

			parsedValue.walk((node) => {
				const { value, type, sourceIndex, nodes } = node;

				if (type !== 'function') return;

				if (!LEGACY_NOTATION_FUNCS.has(value.toLowerCase())) return;

				if (primary === 'modern' && !hasCommas(node)) return;

				if (primary === 'legacy' && hasCommas(node)) return;

				if (context.fix && primary === 'modern') {
					let commaCount = 0;

					// Convert punctuation
					node.nodes = nodes.map((childNode) => {
						if (isComma(childNode)) {
							// Non-alpha commas to space and alpha commas to slashes
							if (commaCount < 2) {
								childNode.type = 'space';
								childNode.value = atLeastOneSpace(childNode.after);
								commaCount++;
							} else {
								childNode.value = '/';
								childNode.before = atLeastOneSpace(childNode.before);
								childNode.after = atLeastOneSpace(childNode.after);
							}
						}

						return childNode;
					});

					// Remove trailing 'a' from legacy function name
					if (LEGACY_FUNCS.has(node.value.toLowerCase())) {
						node.value = node.value.slice(0, -1);
					}

					needsFix = true;

					return;
				}

				report({
					message: messages.expected(primary),
					node: decl,
					index: declarationValueIndex(decl) + sourceIndex,
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

function atLeastOneSpace(whitespace) {
	return whitespace !== '' ? whitespace : ' ';
}

function isComma(node) {
	return node.type === 'div' && node.value === ',';
}

function hasCommas(node) {
	return node.nodes && node.nodes.some((childNode) => isComma(childNode));
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
