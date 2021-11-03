'use strict';

const isSharedLineComment = require('./isSharedLineComment');

/**
 * @param {import('postcss').Node} node
 */
module.exports = function (node) {
	const previousNode = node.prev();

	if (!previousNode || previousNode.type !== 'comment') {
		return false;
	}

	return !isSharedLineComment(previousNode);
};
