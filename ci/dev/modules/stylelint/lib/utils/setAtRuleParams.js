'use strict';

const _ = require('lodash');

/** @typedef {import('postcss').AtRule} AtRule */

/**
 * @param {AtRule} atRule
 * @param {string} params
 * @returns {AtRule} The atRulearation that was passed in.
 */
module.exports = function setAtRuleParams(atRule, params) {
	if (_.has(atRule, 'raws.params')) {
		_.set(atRule, 'raws.params.raw', params);
	} else {
		atRule.params = params;
	}

	return atRule;
};
