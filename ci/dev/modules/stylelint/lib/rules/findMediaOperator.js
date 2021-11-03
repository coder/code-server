// @ts-nocheck

'use strict';

const rangeOperators = ['>=', '<=', '>', '<', '='];
const styleSearch = require('style-search');

module.exports = function (atRule, cb) {
	if (atRule.name.toLowerCase() !== 'media') {
		return;
	}

	const params = atRule.raws.params ? atRule.raws.params.raw : atRule.params;

	styleSearch({ source: params, target: rangeOperators }, (match) => {
		const before = params[match.startIndex - 1];

		if (before === '>' || before === '<') {
			return;
		}

		cb(match, params, atRule);
	});
};
