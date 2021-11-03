// @ts-nocheck

'use strict';

const _ = require('lodash');
const execall = require('execall');
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const styleSearch = require('style-search');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'max-line-length';
const EXCLUDED_PATTERNS = [
	/url\(\s*(\S.*\S)\s*\)/gi, // allow tab, whitespace in url content
	/@import\s+(['"].*['"])/gi,
];

const messages = ruleMessages(ruleName, {
	expected: (max) =>
		`Expected line length to be no more than ${max} ${max === 1 ? 'character' : 'characters'}`,
});

function rule(maxLength, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: maxLength,
				possible: _.isNumber,
			},
			{
				actual: options,
				possible: {
					ignore: ['non-comments', 'comments'],
					ignorePattern: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		const ignoreNonComments = optionsMatches(options, 'ignore', 'non-comments');
		const ignoreComments = optionsMatches(options, 'ignore', 'comments');
		const rootString = context.fix ? root.toString() : root.source.input.css;
		// Array of skipped sub strings, i.e `url(...)`, `@import "..."`
		let skippedSubStrings = [];
		let skippedSubStringsIndex = 0;

		EXCLUDED_PATTERNS.forEach((pattern) =>
			execall(pattern, rootString).forEach((match) => {
				const startOfSubString =
					match.index + match.match.indexOf(_.get(match, 'subMatches[0]', ''));

				return skippedSubStrings.push([
					startOfSubString,
					startOfSubString + _.get(match, 'subMatches[0].length', 0),
				]);
			}),
		);

		skippedSubStrings = skippedSubStrings.sort((a, b) => a[0] - b[0]);

		// Check first line
		checkNewline({ endIndex: 0 });
		// Check subsequent lines
		styleSearch({ source: rootString, target: ['\n'], comments: 'check' }, (match) =>
			checkNewline(match),
		);

		function complain(index) {
			report({
				index,
				result,
				ruleName,
				message: messages.expected(maxLength),
				node: root,
			});
		}

		function tryToPopSubString(start, end) {
			const [startSubString, endSubString] = skippedSubStrings[skippedSubStringsIndex];

			// Excluded substring does not presented in current line
			if (end < startSubString) {
				return 0;
			}

			// Compute excluded substring size regarding to current line indexes
			const excluded = Math.min(end, endSubString) - Math.max(start, startSubString);

			// Current substring is out of range for next lines
			if (endSubString <= end) {
				skippedSubStringsIndex++;
			}

			return excluded;
		}

		function checkNewline(match) {
			let nextNewlineIndex = rootString.indexOf('\n', match.endIndex);

			if (rootString[nextNewlineIndex - 1] === '\r') {
				nextNewlineIndex -= 1;
			}

			// Accommodate last line
			if (nextNewlineIndex === -1) {
				nextNewlineIndex = rootString.length;
			}

			const rawLineLength = nextNewlineIndex - match.endIndex;
			const excludedLength = skippedSubStrings[skippedSubStringsIndex]
				? tryToPopSubString(match.endIndex, nextNewlineIndex)
				: 0;
			const lineText = rootString.slice(match.endIndex, nextNewlineIndex);

			// Case sensitive ignorePattern match
			if (optionsMatches(options, 'ignorePattern', lineText)) {
				return;
			}

			// If the line's length is less than or equal to the specified
			// max, ignore it ... So anything below is liable to be complained about.
			// **Note that the length of any url arguments or import urls
			// are excluded from the calculation.**
			if (rawLineLength - excludedLength <= maxLength) {
				return;
			}

			const complaintIndex = nextNewlineIndex - 1;

			if (ignoreComments) {
				if (match.insideComment) {
					return;
				}

				// This trimming business is to notice when the line starts a
				// comment but that comment is indented, e.g.
				//       /* something here */
				const nextTwoChars = rootString.slice(match.endIndex).trim().slice(0, 2);

				if (nextTwoChars === '/*' || nextTwoChars === '//') {
					return;
				}
			}

			if (ignoreNonComments) {
				if (match.insideComment) {
					return complain(complaintIndex);
				}

				// This trimming business is to notice when the line starts a
				// comment but that comment is indented, e.g.
				//       /* something here */
				const nextTwoChars = rootString.slice(match.endIndex).trim().slice(0, 2);

				if (nextTwoChars !== '/*' && nextTwoChars !== '//') {
					return;
				}

				return complain(complaintIndex);
			}

			// If there are no spaces besides initial (indent) spaces, ignore it
			const lineString = rootString.slice(match.endIndex, nextNewlineIndex);

			if (!lineString.replace(/^\s+/, '').includes(' ')) {
				return;
			}

			return complain(complaintIndex);
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
