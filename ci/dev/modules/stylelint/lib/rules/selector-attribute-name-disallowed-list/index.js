// @ts-nocheck

'use strict';

const _ = require('lodash');
const isStandardSyntaxRule = require('../../utils/isStandardSyntaxRule');
const matchesStringOrRegExp = require('../../utils/matchesStringOrRegExp');
const parseSelector = require('../../utils/parseSelector');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'selector-attribute-name-disallowed-list';

const messages = ruleMessages(ruleName, {
	rejected: (name) => `Unexpected name "${name}"`,
});

function rule(listInput) {
	const list = [].concat(listInput);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: list,
			possible: [_.isString, _.isRegExp],
		});

		if (!validOptions) {
			return;
		}

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) {
				return;
			}

			if (!ruleNode.selector.includes('[')) {
				return;
			}

			parseSelector(ruleNode.selector, result, ruleNode, (selectorTree) => {
				selectorTree.walkAttributes((attributeNode) => {
					const attributeName = attributeNode.qualifiedAttribute;

					if (!matchesStringOrRegExp(attributeName, list)) {
						return;
					}

					report({
						message: messages.rejected(attributeName),
						node: ruleNode,
						index: attributeNode.sourceIndex + attributeNode.offsetOf('attribute'),
						result,
						ruleName,
					});
				});
			});
		});
	};
}

rule.primaryOptionArray = true;

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
