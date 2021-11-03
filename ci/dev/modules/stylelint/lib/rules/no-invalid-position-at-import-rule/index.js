// @ts-nocheck

'use strict';

const isStandardSyntaxAtRule = require('../../utils/isStandardSyntaxAtRule');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'no-invalid-position-at-import-rule';

const messages = ruleMessages(ruleName, {
	rejected: 'Unexpected invalid position @import rule',
});

function rule(actual) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		let invalidPosition = false;

		root.walk((node) => {
			const nodeName = node.name && node.name.toLowerCase();

			if (
				(node.type === 'atrule' &&
					nodeName !== 'charset' &&
					nodeName !== 'import' &&
					isStandardSyntaxAtRule(node)) ||
				(node.type === 'rule' && isStandardSyntaxRule(node))
			) {
				invalidPosition = true;

				return;
			}

			if (node.type === 'atrule' && nodeName === 'import') {
				if (invalidPosition) {
					report({
						message: messages.rejected,
						node,
						result,
						ruleName,
					});
				}
			}
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
