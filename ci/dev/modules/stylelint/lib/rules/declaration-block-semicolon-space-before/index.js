// @ts-nocheck

'use strict';

const blockString = require('../../utils/blockString');
const getDeclarationValue = require('../../utils/getDeclarationValue');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const setDeclarationValue = require('../../utils/setDeclarationValue');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'declaration-block-semicolon-space-before';

const messages = ruleMessages(ruleName, {
	expectedBefore: () => 'Expected single space before ";"',
	rejectedBefore: () => 'Unexpected whitespace before ";"',
	expectedBeforeSingleLine: () =>
		'Expected single space before ";" in a single-line declaration block',
	rejectedBeforeSingleLine: () =>
		'Unexpected whitespace before ";" in a single-line declaration block',
});

function rule(expectation, options, context) {
	const checker = whitespaceChecker('space', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never', 'always-single-line', 'never-single-line'],
		});

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			// Ignore last declaration if there's no trailing semicolon
			const parentRule = decl.parent;

			if (!parentRule.raws.semicolon && parentRule.last === decl) {
				return;
			}

			const declString = decl.toString();

			checker.before({
				source: declString,
				index: declString.length,
				lineCheckStr: blockString(parentRule),
				err: (m) => {
					if (context.fix) {
						const value = getDeclarationValue(decl);

						if (expectation.startsWith('always')) {
							if (decl.important) {
								decl.raws.important = ' !important ';
							} else {
								setDeclarationValue(decl, value.replace(/\s*$/, ' '));
							}

							return;
						}

						if (expectation.startsWith('never')) {
							if (decl.important) {
								decl.raws.important = decl.raws.important.replace(/\s*$/, '');
							} else {
								setDeclarationValue(decl, value.replace(/\s*$/, ''));
							}

							return;
						}
					}

					report({
						message: m,
						node: decl,
						index: decl.toString().length - 1,
						result,
						ruleName,
					});
				},
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
