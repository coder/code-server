// @ts-nocheck

'use strict';

const atRuleParamIndex = require('../utils/atRuleParamIndex');
const report = require('../utils/report');
const styleSearch = require('style-search');

module.exports = function (opts) {
	opts.root.walkAtRules(/^media$/i, (atRule) => {
		const params = atRule.raws.params ? atRule.raws.params.raw : atRule.params;

		styleSearch({ source: params, target: ':' }, (match) => {
			checkColon(params, match.startIndex, atRule);
		});
	});

	function checkColon(source, index, node) {
		opts.locationChecker({
			source,
			index,
			err: (m) => {
				const colonIndex = index + atRuleParamIndex(node);

				if (opts.fix && opts.fix(node, colonIndex)) {
					return;
				}

				report({
					message: m,
					node,
					index: colonIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
				});
			},
		});
	}
};
