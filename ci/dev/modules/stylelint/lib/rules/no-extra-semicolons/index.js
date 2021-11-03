// @ts-nocheck

'use strict';

const isCustomPropertySet = require('../../utils/isCustomPropertySet');
const isStandardSyntaxAtRule = require('../../utils/isStandardSyntaxAtRule');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const styleSearch = require('style-search');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'no-extra-semicolons';

const messages = ruleMessages(ruleName, {
	rejected: 'Unexpected extra semicolon',
});

function getOffsetByNode(node) {
	if (node.parent && node.parent.document) {
		return 0;
	}

	const string = node.root().source.input.css;
	const nodeColumn = node.source.start.column;
	const nodeLine = node.source.start.line;
	let line = 1;
	let column = 1;
	let index = 0;

	for (let i = 0; i < string.length; i++) {
		if (column === nodeColumn && nodeLine === line) {
			index = i;
			break;
		}

		if (string[i] === '\n') {
			column = 1;
			line += 1;
		} else {
			column += 1;
		}
	}

	return index;
}

function rule(actual, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		const rawAfterRoot = root.raws.after;

		if (rawAfterRoot && rawAfterRoot.trim().length !== 0) {
			const fixSemiIndices = [];

			styleSearch({ source: rawAfterRoot, target: ';' }, (match) => {
				if (context.fix) {
					fixSemiIndices.push(match.startIndex);

					return;
				}

				complain(root.source.input.css.length - rawAfterRoot.length + match.startIndex);
			});

			// fix
			if (fixSemiIndices.length) {
				root.raws.after = removeIndices(rawAfterRoot, fixSemiIndices);
			}
		}

		root.walk((node) => {
			if (node.type === 'atrule' && !isStandardSyntaxAtRule(node)) {
				return;
			}

			if (node.type === 'rule' && !isCustomPropertySet(node) && !isStandardSyntaxRule(node)) {
				return;
			}

			let rawBeforeNode = node.raws.before;

			if (rawBeforeNode && rawBeforeNode.trim().length !== 0) {
				let allowedSemi = 0;

				const next = node.next();

				// Ignore semicolon before comment if next node is custom properties sets or comment
				if (
					node.type === 'comment' &&
					next &&
					isCustomPropertySet(next) &&
					node.parent.index(next) > 0
				) {
					allowedSemi = 1;
				}

				const prev = node.prev();

				let rawBeforeIndexStart = 0;

				// Adding previous node string to custom properties set if previous node is comment
				if (
					isCustomPropertySet(node) &&
					node.parent.index(node) > 0 &&
					prev &&
					prev.type === 'comment'
				) {
					rawBeforeNode = prev.toString() + rawBeforeNode;
					allowedSemi = 0;
					rawBeforeIndexStart = prev.toString().length;
				}

				const fixSemiIndices = [];

				styleSearch({ source: rawBeforeNode, target: ';' }, (match, count) => {
					if (count === allowedSemi) {
						return;
					}

					if (context.fix) {
						fixSemiIndices.push(match.startIndex - rawBeforeIndexStart);

						return;
					}

					complain(getOffsetByNode(node) - rawBeforeNode.length + match.startIndex);
				});

				// fix
				if (fixSemiIndices.length) {
					node.raws.before = removeIndices(node.raws.before, fixSemiIndices);
				}
			}

			const rawAfterNode = node.raws.after;

			if (rawAfterNode && rawAfterNode.trim().length !== 0) {
				/**
				 * If the last child is a Less mixin followed by more than one semicolon,
				 * node.raws.after will be populated with that semicolon.
				 * Since we ignore Less mixins, exit here
				 */
				if (
					node.last &&
					node.last.type === 'atrule' &&
					!isCustomPropertySet(node.last) &&
					!isStandardSyntaxAtRule(node.last)
				) {
					return;
				}

				const fixSemiIndices = [];

				styleSearch({ source: rawAfterNode, target: ';' }, (match) => {
					if (context.fix) {
						fixSemiIndices.push(match.startIndex);

						return;
					}

					const index =
						getOffsetByNode(node) +
						node.toString().length -
						1 -
						rawAfterNode.length +
						match.startIndex;

					complain(index);
				});

				// fix
				if (fixSemiIndices.length) {
					node.raws.after = removeIndices(rawAfterNode, fixSemiIndices);
				}
			}

			const rawOwnSemicolon = node.raws.ownSemicolon;

			if (rawOwnSemicolon) {
				let allowedSemi = 0;

				if (isCustomPropertySet(node)) {
					allowedSemi = 1;
				}

				const fixSemiIndices = [];

				styleSearch({ source: rawOwnSemicolon, target: ';' }, (match, count) => {
					if (count === allowedSemi) {
						return;
					}

					if (context.fix) {
						fixSemiIndices.push(match.startIndex);

						return;
					}

					const index =
						getOffsetByNode(node) +
						node.toString().length -
						rawOwnSemicolon.length +
						match.startIndex;

					complain(index);
				});

				// fix
				if (fixSemiIndices.length) {
					node.raws.ownSemicolon = removeIndices(rawOwnSemicolon, fixSemiIndices);
				}
			}
		});

		function complain(index) {
			report({
				message: messages.rejected,
				node: root,
				index,
				result,
				ruleName,
			});
		}

		function removeIndices(str, indices) {
			indices.reverse().forEach((index) => {
				str = str.slice(0, index) + str.slice(index + 1);
			});

			return str;
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
