// @ts-nocheck

'use strict';

const _ = require('lodash');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'comment-pattern';

const messages = ruleMessages(ruleName, {
	expected: (pattern) => `Expected comment to match pattern "${pattern}"`,
});

function rule(pattern) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: pattern,
			possible: [_.isRegExp, _.isString],
		});

		if (!validOptions) {
			return;
		}

		const normalizedPattern = _.isString(pattern) ? new RegExp(pattern) : pattern;

		root.walkComments((comment) => {
			const text = comment.text;

			if (normalizedPattern.test(text)) {
				return;
			}

			report({
				message: messages.expected(pattern),
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
