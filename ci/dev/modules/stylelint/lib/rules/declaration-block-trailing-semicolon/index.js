// @ts-nocheck

'use strict';

const hasBlock = require('../../utils/hasBlock');
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'declaration-block-trailing-semicolon';

const messages = ruleMessages(ruleName, {
	expected: 'Expected a trailing semicolon',
	rejected: 'Unexpected trailing semicolon',
});

function rule(expectation, options, context) {
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
					ignore: ['single-declaration'],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkAtRules((atRule) => {
			if (atRule.parent === root) {
				return;
			}

			if (atRule !== atRule.parent.last) {
				return;
			}

			if (hasBlock(atRule)) {
				return;
			}

			checkLastNode(atRule);
		});

		root.walkDecls((decl) => {
			if (decl.parent.type === 'object') {
				return;
			}

			if (decl !== decl.parent.last) {
				return;
			}

			checkLastNode(decl);
		});

		function checkLastNode(node) {
			const hasSemicolon = node.parent.raws.semicolon;
			const ignoreSingleDeclaration = optionsMatches(options, 'ignore', 'single-declaration');
			let message;

			if (ignoreSingleDeclaration && node.parent.first === node) {
				return;
			}

			if (expectation === 'always') {
				if (hasSemicolon) {
					return;
				}

				// auto-fix
				if (context.fix) {
					node.parent.raws.semicolon = true;

					if (node.type === 'atrule') {
						node.raws.between = '';
						node.parent.raws.after = ' ';
					}

					return;
				}

				message = messages.expected;
			} else if (expectation === 'never') {
				if (!hasSemicolon) {
					return;
				}

				// auto-fix
				if (context.fix) {
					node.parent.raws.semicolon = false;

					return;
				}

				message = messages.rejected;
			}

			report({
				message,
				node,
				index: node.toString().trim().length - 1,
				result,
				ruleName,
			});
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
