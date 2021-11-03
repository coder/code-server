// @ts-nocheck

'use strict';

const isStandardSyntaxDeclaration = require('../utils/isStandardSyntaxDeclaration');
const isStandardSyntaxProperty = require('../utils/isStandardSyntaxProperty');
const report = require('../utils/report');
const styleSearch = require('style-search');

module.exports = function (opts) {
	opts.root.walkDecls((decl) => {
		if (!isStandardSyntaxDeclaration(decl) || !isStandardSyntaxProperty(decl.prop)) {
			return;
		}

		const declString = decl.toString();

		styleSearch(
			{
				source: declString,
				target: ',',
				functionArguments: 'skip',
			},
			(match) => {
				const indexToCheckAfter = opts.determineIndex
					? opts.determineIndex(declString, match)
					: match.startIndex;

				if (indexToCheckAfter === false) {
					return;
				}

				checkComma(declString, indexToCheckAfter, decl);
			},
		);
	});

	function checkComma(source, index, node) {
		opts.locationChecker({
			source,
			index,
			err: (m) => {
				if (opts.fix && opts.fix(node, index)) {
					return;
				}

				report({
					message: m,
					node,
					index,
					result: opts.result,
					ruleName: opts.checkedRuleName,
				});
			},
		});
	}
};
