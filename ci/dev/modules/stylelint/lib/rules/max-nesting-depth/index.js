// @ts-nocheck

'use strict';

const _ = require('lodash');
const hasBlock = require('../../utils/hasBlock');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const optionsMatches = require('../../utils/optionsMatches');
const parser = require('postcss-selector-parser');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'max-nesting-depth';

const messages = ruleMessages(ruleName, {
	expected: (depth) => `Expected nesting depth to be no more than ${depth}`,
});

function rule(max, options) {
	const isIgnoreAtRule = (node) =>
		node.type === 'atrule' && optionsMatches(options, 'ignoreAtRules', node.name);

	return (root, result) => {
		validateOptions(
			result,
			ruleName,
			{
				actual: max,
				possible: [_.isNumber],
			},
			{
				optional: true,
				actual: options,
				possible: {
					ignore: ['blockless-at-rules', 'pseudo-classes'],
					ignoreAtRules: [_.isString, _.isRegExp],
				},
			},
		);

		root.walkRules(checkStatement);
		root.walkAtRules(checkStatement);

		function checkStatement(statement) {
			if (isIgnoreAtRule(statement)) {
				return;
			}

			if (!hasBlock(statement)) {
				return;
			}

			if (statement.selector && !isStandardSyntaxRule(statement)) {
				return;
			}

			const depth = nestingDepth(statement);

			if (depth > max) {
				report({
					ruleName,
					result,
					node: statement,
					message: messages.expected(max),
				});
			}
		}
	};

	function nestingDepth(node, level = 0) {
		const parent = node.parent;

		if (isIgnoreAtRule(parent)) {
			return 0;
		}

		// The nesting depth level's computation has finished
		// when this function, recursively called, receives
		// a node that is not nested -- a direct child of the
		// root node
		if (parent.type === 'root' || (parent.type === 'atrule' && parent.parent.type === 'root')) {
			return level;
		}

		function containsPseudoClassesOnly(selector) {
			const normalized = parser().processSync(selector, { lossless: false });
			const selectors = normalized.split(',');

			return selectors.every((sel) => sel.startsWith('&:') && sel[2] !== ':');
		}

		if (
			(optionsMatches(options, 'ignore', 'blockless-at-rules') &&
				node.type === 'atrule' &&
				node.every((child) => child.type !== 'decl')) ||
			(optionsMatches(options, 'ignore', 'pseudo-classes') &&
				node.type === 'rule' &&
				containsPseudoClassesOnly(node.selector))
		) {
			return nestingDepth(parent, level);
		}

		// Unless any of the conditions above apply, we want to
		// add 1 to the nesting depth level and then check the parent,
		// continuing to add and move up the hierarchy
		// until we hit the root node
		return nestingDepth(parent, level + 1);
	}
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
