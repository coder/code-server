// @ts-nocheck

'use strict';

const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'comment-no-empty';

const messages = ruleMessages(ruleName, {
	rejected: 'Unexpected empty comment',
});

function rule(actual) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		root.walkComments((comment) => {
			// To ignore inline SCSS comments
			if (comment.raws.inline || comment.inline) {
				return;
			}

			// To ignore comments that are not empty
			if (comment.text && comment.text.length !== 0) {
				return;
			}

			report({
				message: messages.rejected,
				node: comment,
				result,
				ruleName,
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
