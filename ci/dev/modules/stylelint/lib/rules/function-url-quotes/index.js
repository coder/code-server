// @ts-nocheck

'use strict';

const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const functionArgumentsSearch = require('../../utils/functionArgumentsSearch');
const isStandardSyntaxUrl = require('../../utils/isStandardSyntaxUrl');
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'function-url-quotes';

const messages = ruleMessages(ruleName, {
	expected: () => 'Expected quotes',
	rejected: () => 'Unexpected quotes',
});

function rule(expectation, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: expectation,
				possible: ['always', 'never'],
			},
			{
				actual: options,
				possible: {
					except: ['empty'],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkAtRules(checkAtRuleParams);
		root.walkDecls(checkDeclParams);

		function checkDeclParams(decl) {
			functionArgumentsSearch(decl.toString().toLowerCase(), 'url', (args, index) => {
				checkArgs(args, decl, index, 'url');
			});
		}

		function checkAtRuleParams(atRule) {
			const atRuleParamsLowerCase = atRule.params.toLowerCase();

			functionArgumentsSearch(atRuleParamsLowerCase, 'url', (args, index) => {
				checkArgs(args, atRule, index + atRuleParamIndex(atRule), 'url');
			});
			functionArgumentsSearch(atRuleParamsLowerCase, 'url-prefix', (args, index) => {
				checkArgs(args, atRule, index + atRuleParamIndex(atRule), 'url-prefix');
			});
			functionArgumentsSearch(atRuleParamsLowerCase, 'domain', (args, index) => {
				checkArgs(args, atRule, index + atRuleParamIndex(atRule), 'domain');
			});
		}

		function checkArgs(args, node, index, functionName) {
			let shouldHasQuotes = expectation === 'always';

			const leftTrimmedArgs = args.trimStart();

			if (!isStandardSyntaxUrl(leftTrimmedArgs)) {
				return;
			}

			const complaintIndex = index + args.length - leftTrimmedArgs.length;
			const hasQuotes = leftTrimmedArgs.startsWith("'") || leftTrimmedArgs.startsWith('"');

			const trimmedArg = args.trim();
			const isEmptyArgument = ['', "''", '""'].includes(trimmedArg);

			if (optionsMatches(options, 'except', 'empty') && isEmptyArgument) {
				shouldHasQuotes = !shouldHasQuotes;
			}

			if (shouldHasQuotes) {
				if (hasQuotes) {
					return;
				}

				complain(messages.expected(functionName), node, complaintIndex);
			} else {
				if (!hasQuotes) {
					return;
				}

				complain(messages.rejected(functionName), node, complaintIndex);
			}
		}

		function complain(message, node, index) {
			report({
				message,
				node,
				index,
				result,
				ruleName,
			});
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
