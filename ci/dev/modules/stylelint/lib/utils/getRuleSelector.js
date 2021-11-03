'use strict';

const _ = require('lodash');

/**
 * @param {import('postcss').Rule} ruleNode
 * @returns {string}
 */
function getRuleSelector(ruleNode) {
	return _.get(ruleNode, 'raws.selector.raw', ruleNode.selector);
}

module.exports = getRuleSelector;
