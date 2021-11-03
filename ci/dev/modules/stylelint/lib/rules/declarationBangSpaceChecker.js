// @ts-nocheck

'use strict';

const declarationValueIndex = require('../utils/declarationValueIndex');
const report = require('../utils/report');
const styleSearch = require('style-search');

module.exports = function (opts) {
	opts.root.walkDecls((decl) => {
		const indexOffset = declarationValueIndex(decl);
		const declString = decl.toString();
		const valueString = decl.toString().slice(indexOffset);

		if (!valueString.includes('!')) {
			return;
		}

		styleSearch({ source: valueString, target: '!' }, (match) => {
			check(declString, match.startIndex + indexOffset, decl);
		});
	});

	function check(source, index, node) {
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
