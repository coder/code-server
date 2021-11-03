// @ts-nocheck

'use strict';

const addEmptyLineBefore = require('../../utils/addEmptyLineBefore');
const blockString = require('../../utils/blockString');
const getPreviousNonSharedLineCommentNode = require('../../utils/getPreviousNonSharedLineCommentNode');
const hasEmptyLine = require('../../utils/hasEmptyLine');
const isAfterComment = require('../../utils/isAfterComment');
const isCustomProperty = require('../../utils/isCustomProperty');
const isFirstNested = require('../../utils/isFirstNested');
const isSingleLineString = require('../../utils/isSingleLineString');
const isStandardSyntaxDeclaration = require('../../utils/isStandardSyntaxDeclaration');
const optionsMatches = require('../../utils/optionsMatches');
const removeEmptyLinesBefore = require('../../utils/removeEmptyLinesBefore');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'custom-property-empty-line-before';

const messages = ruleMessages(ruleName, {
	expected: 'Expected empty line before custom property',
	rejected: 'Unexpected empty line before custom property',
});

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
					except: ['first-nested', 'after-comment', 'after-custom-property'],
					ignore: ['after-comment', 'first-nested', 'inside-single-line-block'],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			const prop = decl.prop;
			const parent = decl.parent;

			if (!isStandardSyntaxDeclaration(decl)) {
				return;
			}

			if (!isCustomProperty(prop)) {
				return;
			}

			// Optionally ignore the node if a comment precedes it
			if (optionsMatches(options, 'ignore', 'after-comment') && isAfterComment(decl)) {
				return;
			}

			// Optionally ignore the node if it is the first nested
			if (optionsMatches(options, 'ignore', 'first-nested') && isFirstNested(decl)) {
				return;
			}

			// Optionally ignore nodes inside single-line blocks
			if (
				optionsMatches(options, 'ignore', 'inside-single-line-block') &&
				isSingleLineString(blockString(parent))
			) {
				return;
			}

			let expectEmptyLineBefore = expectation === 'always';

			// Optionally reverse the expectation if any exceptions apply
			if (
				(optionsMatches(options, 'except', 'first-nested') && isFirstNested(decl)) ||
				(optionsMatches(options, 'except', 'after-comment') && isAfterComment(decl)) ||
				(optionsMatches(options, 'except', 'after-custom-property') && isAfterCustomProperty(decl))
			) {
				expectEmptyLineBefore = !expectEmptyLineBefore;
			}

			const hasEmptyLineBefore = hasEmptyLine(decl.raws.before);

			// Return if the expectation is met
			if (expectEmptyLineBefore === hasEmptyLineBefore) {
				return;
			}

			// Fix
			if (context.fix) {
				if (expectEmptyLineBefore) {
					addEmptyLineBefore(decl, context.newline);
				} else {
					removeEmptyLinesBefore(decl, context.newline);
				}

				return;
			}

			const message = expectEmptyLineBefore ? messages.expected : messages.rejected;

			report({
				message,
				node: decl,
				result,
				ruleName,
			});
		});
	};
}

function isAfterCustomProperty(decl) {
	const prevNode = getPreviousNonSharedLineCommentNode(decl);

	return prevNode && prevNode.prop && isCustomProperty(prevNode.prop);
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
