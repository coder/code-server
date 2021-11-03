// @ts-nocheck

'use strict';

const _ = require('lodash');
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const styleSearch = require('style-search');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'max-empty-lines';

const messages = ruleMessages(ruleName, {
	expected: (max) => `Expected no more than ${max} empty ${max === 1 ? 'line' : 'lines'}`,
});

function rule(max, options, context) {
	let emptyLines = 0;
	let lastIndex = -1;

	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: max,
				possible: _.isNumber,
			},
			{
				actual: options,
				possible: {
					ignore: ['comments'],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		const ignoreComments = optionsMatches(options, 'ignore', 'comments');
		const getChars = _.partial(replaceEmptyLines, max);

		/**
		 * 1. walk nodes & replace enterchar
		 * 2. deal with special case.
		 */
		if (context.fix) {
			root.walk((node) => {
				if (node.type === 'comment') {
					// for inline comments
					if (node.raws.inline) {
						node.raws.before = getChars(node.raws.before);
					}

					if (!ignoreComments) {
						node.raws.left = getChars(node.raws.left);
						node.raws.right = getChars(node.raws.right);
					}
				} else {
					if (node.raws.before) {
						node.raws.before = getChars(node.raws.before);
					}

					if (node.raws.after) {
						node.raws.after = getChars(node.raws.after);
					}
				}
			});

			// first node
			const firstNodeRawsBefore = _.get(root, 'first.raws.before');
			// root raws
			const rootRawsAfter = _.get(root, 'raws.after');

			// not document node
			if (_.get(root, 'document.constructor.name') !== 'Document') {
				if (firstNodeRawsBefore) {
					_.set(root, 'first.raws.before', getChars(firstNodeRawsBefore, true));
				}

				if (rootRawsAfter) {
					// when max setted 0, should be treated as 1 in this situation.
					_.set(root, 'raws.after', replaceEmptyLines(max === 0 ? 1 : max, rootRawsAfter, true));
				}
			} else if (rootRawsAfter) {
				// `css in js` or `html`
				_.set(root, 'raws.after', replaceEmptyLines(max === 0 ? 1 : max, rootRawsAfter));
			}

			return;
		}

		emptyLines = 0;
		lastIndex = -1;
		const rootString = root.toString();

		styleSearch(
			{
				source: rootString,
				target: /\r\n/.test(rootString) ? '\r\n' : '\n',
				comments: ignoreComments ? 'skip' : 'check',
			},
			(match) => {
				checkMatch(rootString, match.startIndex, match.endIndex, root);
			},
		);

		function checkMatch(source, matchStartIndex, matchEndIndex, node) {
			const eof = matchEndIndex === source.length;
			let violation = false;

			// Additional check for beginning of file
			if (!matchStartIndex || lastIndex === matchStartIndex) {
				emptyLines++;
			} else {
				emptyLines = 0;
			}

			lastIndex = matchEndIndex;

			if (emptyLines > max) violation = true;

			if (!eof && !violation) return;

			if (violation) {
				report({
					message: messages.expected(max),
					node,
					index: matchStartIndex,
					result,
					ruleName,
				});
			}

			// Additional check for end of file
			if (eof && max) {
				emptyLines++;

				if (emptyLines > max && isEofNode(result.root, node)) {
					report({
						message: messages.expected(max),
						node,
						index: matchEndIndex,
						result,
						ruleName,
					});
				}
			}
		}

		function replaceEmptyLines(maxLines, str, isSpecialCase = false) {
			const repeatTimes = isSpecialCase ? maxLines : maxLines + 1;

			if (repeatTimes === 0 || typeof str !== 'string') {
				return '';
			}

			const emptyLFLines = '\n'.repeat(repeatTimes);
			const emptyCRLFLines = '\r\n'.repeat(repeatTimes);

			return /(\r\n)+/g.test(str)
				? str.replace(/(\r\n)+/g, ($1) => {
						if ($1.length / 2 > repeatTimes) {
							return emptyCRLFLines;
						}

						return $1;
				  })
				: str.replace(/(\n)+/g, ($1) => {
						if ($1.length > repeatTimes) {
							return emptyLFLines;
						}

						return $1;
				  });
		}
	};
}

/**
 * Checks whether the given node is the last node of file.
 * @param {Document|null} document the document node with `postcss-html` and `postcss-jsx`.
 * @param {Root} root the root node of css
 */
function isEofNode(document, root) {
	if (!document || document.constructor.name !== 'Document') {
		return true;
	}

	// In the `postcss-html` and `postcss-jsx` syntax, checks that there is text after the given node.
	let after;

	if (root === document.last) {
		after = _.get(document, 'raws.afterEnd');
	} else {
		const rootIndex = document.index(root);

		after = _.get(document.nodes[rootIndex + 1], 'raws.beforeStart');
	}

	return !String(after).trim();
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
