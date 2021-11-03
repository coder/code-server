// @ts-nocheck

'use strict';

const _ = require('lodash');
const beforeBlockString = require('../../utils/beforeBlockString');
const hasBlock = require('../../utils/hasBlock');
const hasEmptyBlock = require('../../utils/hasEmptyBlock');
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'block-no-empty';

const messages = ruleMessages(ruleName, {
	rejected: 'Unexpected empty block',
});

function rule(primary, options = {}) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: _.isBoolean,
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

		// Check both kinds of statements: rules and at-rules
		root.walkRules(check);
		root.walkAtRules(check);

		function check(statement) {
			if (!hasEmptyBlock(statement) && !ignoreComments) {
				return;
			}

			if (!hasBlock(statement)) {
				return;
			}

			const hasCommentsOnly = statement.nodes.every((node) => node.type === 'comment');

			if (!hasCommentsOnly) {
				return;
			}

			let index = beforeBlockString(statement, { noRawBefore: true }).length;

			// For empty blocks when using SugarSS parser
			if (statement.raws.between === undefined) {
				index--;
			}

			report({
				message: messages.rejected,
				node: statement,
				index,
				result,
				ruleName,
			});
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
