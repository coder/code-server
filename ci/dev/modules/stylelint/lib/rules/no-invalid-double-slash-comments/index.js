// @ts-nocheck

'use strict';

const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'no-invalid-double-slash-comments';

const messages = ruleMessages(ruleName, {
	rejected: 'Unexpected double-slash CSS comment',
});

function rule(actual) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			if (decl.prop.startsWith('//')) {
				report({
					message: messages.rejected,
					node: decl,
					result,
					ruleName,
				});
			}
		});

		root.walkRules((ruleNode) => {
			ruleNode.selectors.forEach((selector) => {
				if (selector.startsWith('//')) {
					report({
						message: messages.rejected,
						node: ruleNode,
						result,
						ruleName,
					});
				}
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
