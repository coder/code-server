// @ts-nocheck

'use strict';

const isStandardSyntaxAtRule = require('../utils/isStandardSyntaxAtRule');
const report = require('../utils/report');

module.exports = function (options) {
	options.root.walkAtRules((atRule) => {
		if (!isStandardSyntaxAtRule(atRule)) {
			return;
		}

		checkColon(
			`@${atRule.name}${atRule.raws.afterName || ''}${atRule.params}`,
			atRule.name.length,
			atRule,
		);
	});

	function checkColon(source, index, node) {
		options.locationChecker({
			source,
			index,
			err: (m) => {
				if (options.fix) {
					options.fix(node);

					return;
				}

				report({
					message: m,
					node,
					index,
					result: options.result,
					ruleName: options.checkedRuleName,
				});
			},
			errTarget: `@${node.name}`,
		});
	}
};
