// @ts-nocheck

'use strict';

const _ = require('lodash');
const functionArgumentsSearch = require('../../utils/functionArgumentsSearch');
const isStandardSyntaxUrl = require('../../utils/isStandardSyntaxUrl');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'function-url-no-scheme-relative';

const messages = ruleMessages(ruleName, {
	rejected: 'Unexpected scheme-relative url',
});

function rule(actual) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			functionArgumentsSearch(decl.toString().toLowerCase(), 'url', (args, index) => {
				const url = _.trim(args, ' \'"');

				if (!isStandardSyntaxUrl(url) || !url.startsWith('//')) {
					return;
				}

				report({
					message: messages.rejected,
					node: decl,
					index,
					result,
					ruleName,
				});
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
