// @ts-nocheck

'use strict';

const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'unicode-bom';

const messages = ruleMessages(ruleName, {
	expected: 'Expected Unicode BOM',
	rejected: 'Unexpected Unicode BOM',
});

function rule(expectation) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never'],
		});

		if (
			!validOptions ||
			root.source.inline ||
			root.source.lang === 'object-literal' ||
			// Ignore HTML documents
			root.document !== undefined
		) {
			return;
		}

		const { hasBOM } = root.source.input;

		if (expectation === 'always' && !hasBOM) {
			report({
				result,
				ruleName,
				message: messages.expected,
				root,
				line: 1,
			});
		}

		if (expectation === 'never' && hasBOM) {
			report({
				result,
				ruleName,
				message: messages.rejected,
				root,
				line: 1,
			});
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
