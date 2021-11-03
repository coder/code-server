// @ts-nocheck

'use strict';

const _ = require('lodash');
const containsString = require('../../utils/containsString');
const matchesStringOrRegExp = require('../../utils/matchesStringOrRegExp');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'comment-word-blacklist';

const messages = ruleMessages(ruleName, {
	rejected: (pattern) => `Unexpected word matching pattern "${pattern}"`,
});

function rule(list) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: list,
			possible: [_.isString, _.isRegExp],
		});

		if (!validOptions) {
			return;
		}

		result.warn(`'${ruleName}' has been deprecated. Instead use 'comment-word-disallowed-list'.`, {
			stylelintType: 'deprecation',
			stylelintReference: `https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/${ruleName}/README.md`,
		});

		root.walkComments((comment) => {
			const text = comment.text;
			const rawComment = comment.toString();
			const firstFourChars = rawComment.substr(0, 4);

			// Return early if sourcemap
			if (firstFourChars === '/*# ') {
				return;
			}

			const matchesWord = matchesStringOrRegExp(text, list) || containsString(text, list);

			if (!matchesWord) {
				return;
			}

			report({
				message: messages.rejected(matchesWord.pattern),
				node: comment,
				result,
				ruleName,
			});
		});
	};
}

rule.primaryOptionArray = true;

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = { deprecated: true };

module.exports = rule;
