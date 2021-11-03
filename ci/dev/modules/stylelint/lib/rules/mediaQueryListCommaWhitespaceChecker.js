// @ts-nocheck

'use strict';

const atRuleParamIndex = require('../utils/atRuleParamIndex');
const report = require('../utils/report');
const styleSearch = require('style-search');

module.exports = function (opts) {
	opts.root.walkAtRules(/^media$/i, (atRule) => {
		const params = atRule.raws.params ? atRule.raws.params.raw : atRule.params;

		styleSearch({ source: params, target: ',' }, (match) => {
			let index = match.startIndex;

			if (opts.allowTrailingComments) {
				// if there is a comment on the same line at after the comma, check the space after the comment.
				let execResult;

				while ((execResult = /^[^\S\r\n]*\/\*([\s\S]*?)\*\//.exec(params.slice(index + 1)))) {
					index += execResult[0].length;
				}

				if ((execResult = /^([^\S\r\n]*\/\/([\s\S]*?))\r?\n/.exec(params.slice(index + 1)))) {
					index += execResult[1].length;
				}
			}

			checkComma(params, index, atRule);
		});
	});

	function checkComma(source, index, node) {
		opts.locationChecker({
			source,
			index,
			err: (m) => {
				const commaIndex = index + atRuleParamIndex(node);

				if (opts.fix && opts.fix(node, commaIndex)) {
					return;
				}

				report({
					message: m,
					node,
					index: commaIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
				});
			},
		});
	}
};
