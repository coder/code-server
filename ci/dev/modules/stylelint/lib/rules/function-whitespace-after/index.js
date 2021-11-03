// @ts-nocheck

'use strict';

const _ = require('lodash');
const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const getDeclarationValue = require('../../utils/getDeclarationValue');
const isWhitespace = require('../../utils/isWhitespace');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const setDeclarationValue = require('../../utils/setDeclarationValue');
const styleSearch = require('style-search');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'function-whitespace-after';

const messages = ruleMessages(ruleName, {
	expected: 'Expected whitespace after ")"',
	rejected: 'Unexpected whitespace after ")"',
});

const ACCEPTABLE_AFTER_CLOSING_PAREN = new Set([')', ',', '}', ':', '/', undefined]);

function rule(expectation, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never'],
		});

		if (!validOptions) {
			return;
		}

		function check(node, value, getIndex, fix) {
			styleSearch(
				{
					source: value,
					target: ')',
					functionArguments: 'only',
				},
				(match) => {
					checkClosingParen(value, match.startIndex + 1, node, getIndex, fix);
				},
			);
		}

		function checkClosingParen(source, index, node, getIndex, fix) {
			const nextChar = source[index];

			if (expectation === 'always') {
				// Allow for the next character to be a single empty space,
				// another closing parenthesis, a comma, or the end of the value
				if (nextChar === ' ') {
					return;
				}

				if (nextChar === '\n') {
					return;
				}

				if (source.substr(index, 2) === '\r\n') {
					return;
				}

				if (ACCEPTABLE_AFTER_CLOSING_PAREN.has(nextChar)) {
					return;
				}

				if (fix) {
					fix(index);

					return;
				}

				report({
					message: messages.expected,
					node,
					index: getIndex(node) + index,
					result,
					ruleName,
				});
			} else if (expectation === 'never') {
				if (isWhitespace(nextChar)) {
					if (fix) {
						fix(index);

						return;
					}

					report({
						message: messages.rejected,
						node,
						index: getIndex(node) + index,
						result,
						ruleName,
					});
				}
			}
		}

		function createFixer(value) {
			let fixed = '';
			let lastIndex = 0;
			let applyFix;

			if (expectation === 'always') {
				applyFix = (index) => {
					// eslint-disable-next-line prefer-template
					fixed += value.slice(lastIndex, index) + ' ';
					lastIndex = index;
				};
			} else if (expectation === 'never') {
				applyFix = (index) => {
					let whitespaceEndIndex = index + 1;

					while (whitespaceEndIndex < value.length && isWhitespace(value[whitespaceEndIndex])) {
						whitespaceEndIndex++;
					}

					fixed += value.slice(lastIndex, index);
					lastIndex = whitespaceEndIndex;
				};
			}

			return {
				applyFix,
				get hasFixed() {
					return Boolean(lastIndex);
				},
				get fixed() {
					return fixed + value.slice(lastIndex);
				},
			};
		}

		root.walkAtRules(/^import$/i, (atRule) => {
			const param = _.get(atRule, 'raws.params.raw', atRule.params);
			const fixer = context.fix && createFixer(param);

			check(atRule, param, atRuleParamIndex, fixer && fixer.applyFix);

			if (fixer && fixer.hasFixed) {
				if (atRule.raws.params) {
					atRule.raws.params.raw = fixer.fixed;
				} else {
					atRule.params = fixer.fixed;
				}
			}
		});
		root.walkDecls((decl) => {
			const value = getDeclarationValue(decl);
			const fixer = context.fix && createFixer(value);

			check(decl, value, declarationValueIndex, fixer && fixer.applyFix);

			if (fixer && fixer.hasFixed) {
				setDeclarationValue(decl, fixer.fixed);
			}
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
