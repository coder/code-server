'use strict';

const _ = require('lodash');
const getPreviousNonSharedLineCommentNode = require('./getPreviousNonSharedLineCommentNode');
const isBlocklessAtRuleAfterBlocklessAtRule = require('./isBlocklessAtRuleAfterBlocklessAtRule');

/**
 * @param {import('postcss').AtRule} atRule
 * @returns {boolean}
 */
module.exports = function (atRule) {
	if (!isBlocklessAtRuleAfterBlocklessAtRule(atRule)) {
		return false;
	}

	const previousNode = getPreviousNonSharedLineCommentNode(atRule);

	return _.get(previousNode, 'name') === atRule.name;
};
