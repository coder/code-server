// @ts-nocheck

'use strict';

const _ = require('lodash');
const beforeBlockString = require('../../utils/beforeBlockString');
const blockString = require('../../utils/blockString');
const isSingleLineString = require('../../utils/isSingleLineString');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'declaration-block-single-line-max-declarations';

const messages = ruleMessages(ruleName, {
	expected: (max) => `Expected no more than ${max} ${max === 1 ? 'declaration' : 'declarations'}`,
});

function rule(quantity) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: quantity,
			possible: [_.isNumber],
		});

		if (!validOptions) {
			return;
		}

		root.walkRules((ruleNode) => {
			if (!isSingleLineString(blockString(ruleNode))) {
				return;
			}

			if (!ruleNode.nodes) {
				return;
			}

			const decls = ruleNode.nodes.filter((node) => node.type === 'decl');

			if (decls.length <= quantity) {
				return;
			}

			report({
				message: messages.expected(quantity),
				node: ruleNode,
				index: beforeBlockString(ruleNode, { noRawBefore: true }).length,
				result,
				ruleName,
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
