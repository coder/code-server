'use strict';

const getPreviousNonSharedLineCommentNode = require('./getPreviousNonSharedLineCommentNode');
const hasBlock = require('./hasBlock');

/**
 * @param {import('postcss').AtRule} atRule
 * @returns {boolean}
 */
module.exports = function (atRule) {
	if (atRule.type !== 'atrule') {
		return false;
	}

	const previousNode = getPreviousNonSharedLineCommentNode(atRule);

	if (previousNode === undefined) {
		return false;
	}

	return previousNode.type === 'atrule' && !hasBlock(previousNode) && !hasBlock(atRule);
};
