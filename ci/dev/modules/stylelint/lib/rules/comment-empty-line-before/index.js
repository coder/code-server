// @ts-nocheck

'use strict';

const _ = require('lodash');
const addEmptyLineBefore = require('../../utils/addEmptyLineBefore');
const hasEmptyLine = require('../../utils/hasEmptyLine');
const isAfterComment = require('../../utils/isAfterComment');
const isFirstNested = require('../../utils/isFirstNested');
const isFirstNodeOfRoot = require('../../utils/isFirstNodeOfRoot');
const isSharedLineComment = require('../../utils/isSharedLineComment');
const optionsMatches = require('../../utils/optionsMatches');
const removeEmptyLinesBefore = require('../../utils/removeEmptyLinesBefore');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'comment-empty-line-before';

const messages = ruleMessages(ruleName, {
	expected: 'Expected empty line before comment',
	rejected: 'Unexpected empty line before comment',
});

const stylelintCommandPrefix = 'stylelint-';

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
					except: ['first-nested'],
					ignore: ['stylelint-commands', 'after-comment'],
					ignoreComments: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkComments((comment) => {
			// Ignore the first node
			if (isFirstNodeOfRoot(comment)) {
				return;
			}

			// Optionally ignore stylelint commands
			if (
				comment.text.startsWith(stylelintCommandPrefix) &&
				optionsMatches(options, 'ignore', 'stylelint-commands')
			) {
				return;
			}

			// Optionally ignore newlines between comments
			if (optionsMatches(options, 'ignore', 'after-comment') && isAfterComment(comment)) {
				return;
			}

			// Ignore comments matching the ignoreComments option.
			if (optionsMatches(options, 'ignoreComments', comment.text)) {
				return;
			}

			// Ignore shared-line comments
			if (isSharedLineComment(comment)) {
				return;
			}

			// Ignore SCSS comments
			if (comment.raws.inline || comment.inline) {
				return;
			}

			const expectEmptyLineBefore = (() => {
				if (optionsMatches(options, 'except', 'first-nested') && isFirstNested(comment)) {
					return false;
				}

				return expectation === 'always';
			})();

			const before = comment.raws.before || '';
			const hasEmptyLineBefore = hasEmptyLine(before);

			// Return if the expectation is met
			if (expectEmptyLineBefore === hasEmptyLineBefore) {
				return;
			}

			// Fix
			if (context.fix) {
				if (expectEmptyLineBefore) {
					addEmptyLineBefore(comment, context.newline);
				} else {
					removeEmptyLinesBefore(comment, context.newline);
				}

				return;
			}

			const message = expectEmptyLineBefore ? messages.expected : messages.rejected;

			report({
				message,
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
