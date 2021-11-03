// @ts-nocheck

'use strict';

const blockString = require('../../utils/blockString');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'declaration-block-semicolon-newline-before';

const messages = ruleMessages(ruleName, {
	expectedBefore: () => 'Expected newline before ";"',
	expectedBeforeMultiLine: () => 'Expected newline before ";" in a multi-line declaration block',
	rejectedBeforeMultiLine: () =>
		'Unexpected whitespace before ";" in a multi-line declaration block',
});

function rule(expectation) {
	const checker = whitespaceChecker('newline', expectation, messages);

	return function (root, result) {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'always-multi-line', 'never-multi-line'],
		});

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			const parentRule = decl.parent;

			if (!parentRule.raws.semicolon && parentRule.last === decl) {
				return;
			}

			const declString = decl.toString();

			checker.beforeAllowingIndentation({
				source: declString,
				index: declString.length,
				lineCheckStr: blockString(parentRule),
				err: (m) => {
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
