// @ts-nocheck

'use strict';

const _ = require('lodash');

const isWhitespace = require('../../utils/isWhitespace');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'comment-whitespace-inside';

const messages = ruleMessages(ruleName, {
	expectedOpening: 'Expected whitespace after "/*"',
	rejectedOpening: 'Unexpected whitespace after "/*"',
	expectedClosing: 'Expected whitespace before "*/"',
	rejectedClosing: 'Unexpected whitespace before "*/"',
});

function addWhitespaceBefore(comment) {
	if (comment.text.startsWith('*')) {
		comment.text = comment.text.replace(/^(\*+)/, `$1 `);
	} else {
		comment.raws.left = ' ';
	}
}

function addWhitespaceAfter(comment) {
	if (_.last(comment.text) === '*') {
		comment.text = comment.text.replace(/(\*+)$/, ` $1`);
	} else {
		comment.raws.right = ' ';
	}
}

function rule(expectation, options, context) {
	return function (root, result) {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never'],
		});

		if (!validOptions) {
			return;
		}

		root.walkComments((comment) => {
			if (comment.raws.inline || comment.inline) {
				return;
			}

			const rawComment = comment.toString();
			const firstFourChars = rawComment.substr(0, 4);

			// Return early if sourcemap or copyright comment
			if (/^\/\*[#!]\s/.test(firstFourChars)) {
				return;
			}

			const leftMatches = rawComment.match(/(^\/\*+)(\s)?/);
			const rightMatches = rawComment.match(/(\s)?(\*+\/)$/);
			const opener = leftMatches[1];
			const leftSpace = leftMatches[2] || '';
			const rightSpace = rightMatches[1] || '';
			const closer = rightMatches[2];

			if (expectation === 'never' && leftSpace !== '') {
				complain(messages.rejectedOpening, opener.length);
			}

			if (expectation === 'always' && !isWhitespace(leftSpace)) {
				complain(messages.expectedOpening, opener.length);
			}

			if (expectation === 'never' && rightSpace !== '') {
				complain(messages.rejectedClosing, comment.toString().length - closer.length - 1);
			}

			if (expectation === 'always' && !isWhitespace(rightSpace)) {
				complain(messages.expectedClosing, comment.toString().length - closer.length - 1);
			}

			function complain(message, index) {
				if (context.fix) {
					if (expectation === 'never') {
						comment.raws.left = '';
						comment.raws.right = '';
						comment.text = comment.text.replace(/^(\*+)(\s+)?/, '$1').replace(/(\s+)?(\*+)$/, '$2');
					} else {
						if (!leftSpace) {
							addWhitespaceBefore(comment);
						}

						if (!rightSpace) {
							addWhitespaceAfter(comment);
						}
					}

					return;
				}

				report({
					message,
					index,
					result,
					ruleName,
					node: comment,
				});
			}
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
