// @ts-nocheck

'use strict';

const mediaParser = require('postcss-media-query-parser').default;
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'no-duplicate-at-import-rules';

const messages = ruleMessages(ruleName, {
	rejected: (atImport) => `Unexpected duplicate @import rule ${atImport}`,
});

function rule(actual) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		const imports = {};

		root.walkAtRules(/^import$/i, (atRule) => {
			const params = valueParser(atRule.params).nodes;

			if (!params.length) {
				return;
			}

			// extract uri from url() if exists
			const uri =
				params[0].type === 'function' && params[0].value === 'url'
					? params[0].nodes[0].value
					: params[0].value;
			// extract media queries if any
			const media = mediaParser(valueParser.stringify(params.slice(1)))
				.nodes.map((n) => n.value.replace(/\s/g, ''))
				.filter((n) => n.length);

			const isDuplicate = media.length
				? imports[uri] && media.some((q) => imports[uri].includes(q))
				: imports[uri];

			if (isDuplicate) {
				report({
					message: messages.rejected(uri),
					node: atRule,
					result,
					ruleName,
				});

				return;
			}

			if (!imports[uri]) imports[uri] = [];

			imports[uri] = imports[uri].concat(media);
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
