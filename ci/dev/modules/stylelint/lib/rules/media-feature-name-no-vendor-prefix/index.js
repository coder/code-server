// @ts-nocheck

'use strict';

const isAutoprefixable = require('../../utils/isAutoprefixable');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'media-feature-name-no-vendor-prefix';

const messages = ruleMessages(ruleName, {
	rejected: 'Unexpected vendor-prefix',
});

function rule(actual, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		root.walkAtRules(/^media$/i, (atRule) => {
			const params = atRule.params;

			if (!isAutoprefixable.mediaFeatureName(params)) {
				return;
			}

			const matches = atRule.toString().match(/-[a-z-]+device-pixel-ratio/gi);

			if (!matches) {
				return;
			}

			if (context.fix) {
				atRule.params = isAutoprefixable.unprefix(atRule.params);

				return;
			}

			matches.forEach((match) => {
				report({
					message: messages.rejected,
					node: atRule,
					word: match,
					result,
					ruleName,
				});
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
