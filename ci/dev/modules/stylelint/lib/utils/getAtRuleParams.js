'use strict';

const _ = require('lodash');

/**
 * @param {import('postcss').AtRule} atRule
 * @returns {string}
 */
module.exports = function getAtRuleParams(atRule) {
	return _.get(atRule, 'raws.params.raw', atRule.params);
};
