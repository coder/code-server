// @ts-nocheck

'use strict';

const isOnlyWhitespace = require('../../utils/isOnlyWhitespace');
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const styleSearch = require('style-search');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'no-eol-whitespace';

const messages = ruleMessages(ruleName, {
	rejected: 'Unexpected whitespace at end of line',
});

const whitespacesToReject = new Set([' ', '\t']);

function fixString(str) {
	return str.replace(/[ \t]+$/, '');
}

function findErrorStartIndex(
	lastEOLIndex,
	string,
	{ ignoreEmptyLines, isRootFirst } = {
		ignoreEmptyLines: false,
		isRootFirst: false,
	},
) {
	const eolWhitespaceIndex = lastEOLIndex - 1;

	// If the character before newline is not whitespace, ignore
	if (!whitespacesToReject.has(string[eolWhitespaceIndex])) {
		return -1;
	}

	if (ignoreEmptyLines) {
		// If there is only whitespace between the previous newline and
		// this newline, ignore
		const beforeNewlineIndex = string.lastIndexOf('\n', eolWhitespaceIndex);

		if (beforeNewlineIndex >= 0 || isRootFirst) {
			const line = string.substring(beforeNewlineIndex, eolWhitespaceIndex);

			if (isOnlyWhitespace(line)) {
				return -1;
			}
		}
	}

	return eolWhitespaceIndex;
}

function rule(on, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: on,
			},
			{
				optional: true,
				actual: options,
				possible: {
					ignore: ['empty-lines'],
				},
			},
		);

		if (!validOptions) {
			return;
		}

		const ignoreEmptyLines = optionsMatches(options, 'ignore', 'empty-lines');

		if (context.fix) {
			fix(root);
		}

		const rootString = context.fix ? root.toString() : root.source.input.css;
		const reportFromIndex = (index) => {
			report({
				message: messages.rejected,
				node: root,
				index,
				result,
				ruleName,
			});
		};

		eachEolWhitespace(rootString, reportFromIndex, true);

		const errorIndex = findErrorStartIndex(rootString.length, rootString, {
			ignoreEmptyLines,
			isRootFirst: true,
		});

		if (errorIndex > -1) {
			reportFromIndex(errorIndex);
		}

		/**
		 * Iterate each whitespace at the end of each line of the given string.
		 * @param {string} string the source code string
		 * @param {Function} callback callback the whitespace index at the end of each line.
		 * @param {boolean} isRootFirst set `true` if the given string is the first token of the root.
		 * @returns {void}
		 */
		function eachEolWhitespace(string, callback, isRootFirst) {
			styleSearch(
				{
					source: string,
					target: ['\n', '\r'],
					comments: 'check',
				},
				(match) => {
					const index = findErrorStartIndex(match.startIndex, string, {
						ignoreEmptyLines,
						isRootFirst,
					});

					if (index > -1) {
						callback(index);
					}
				},
			);
		}

		function fix(rootNode) {
			let isRootFirst = true;

			rootNode.walk((node) => {
				fixText(
					node.raws.before,
					(fixed) => {
						node.raws.before = fixed;
					},
					isRootFirst,
				);
				isRootFirst = false;

				// AtRule
				fixText(node.raws.afterName, (fixed) => {
					node.raws.afterName = fixed;
				});

				if (node.raws.params) {
					fixText(node.raws.params.raw, (fixed) => {
						node.raws.params.raw = fixed;
					});
				} else {
					fixText(node.params, (fixed) => {
						node.params = fixed;
					});
				}

				// Rule
				if (node.raws.selector) {
					fixText(node.raws.selector.raw, (fixed) => {
						node.raws.selector.raw = fixed;
					});
				} else {
					fixText(node.selector, (fixed) => {
						node.selector = fixed;
					});
				}

				// AtRule or Rule or Decl
				fixText(node.raws.between, (fixed) => {
					node.raws.between = fixed;
				});

				// Decl
				if (node.raws.value) {
					fixText(node.raws.value.raw, (fixed) => {
						node.raws.value.raw = fixed;
					});
				} else {
					fixText(node.value, (fixed) => {
						node.value = fixed;
					});
				}

				// Comment
				fixText(node.raws.left, (fixed) => {
					node.raws.left = fixed;
				});

				if (node.raws.inline) {
					node.raws.right = fixString(node.raws.right);
				} else {
					fixText(node.raws.right, (fixed) => {
						node.raws.right = fixed;
					});
				}

				fixText(node.text, (fixed) => {
					node.text = fixed;
				});

				fixText(node.raws.after, (fixed) => {
					node.raws.after = fixed;
				});
			});

			fixText(
				rootNode.raws.after,
				(fixed) => {
					rootNode.raws.after = fixed;
				},
				isRootFirst,
			);

			if (typeof rootNode.raws.after === 'string') {
				const lastEOL = Math.max(
					rootNode.raws.after.lastIndexOf('\n'),
					rootNode.raws.after.lastIndexOf('\r'),
				);

				if (lastEOL !== rootNode.raws.after.length - 1) {
					rootNode.raws.after =
						rootNode.raws.after.slice(0, lastEOL + 1) +
						fixString(rootNode.raws.after.slice(lastEOL + 1));
				}
			}
		}

		function fixText(value, fixFn, isRootFirst) {
			if (!value) {
				return;
			}

			let fixed = '';
			let lastIndex = 0;

			eachEolWhitespace(
				value,
				(index) => {
					const newlineIndex = index + 1;

					fixed += fixString(value.slice(lastIndex, newlineIndex));
					lastIndex = newlineIndex;
				},
				isRootFirst,
			);

			if (lastIndex) {
				fixed += value.slice(lastIndex);
				fixFn(fixed);
			}
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
