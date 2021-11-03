'use strict';

const isSharedLineComment = require('./isSharedLineComment');

/**
 * @param {import('postcss').Node} node
 */
function isAfterSingleLineComment(node) {
	const prevNode = node.prev();

	return (
		prevNode !== undefined &&
		prevNode.type === 'comment' &&
		!isSharedLineComment(prevNode) &&
		prevNode.source &&
		prevNode.source.start &&
		prevNode.source.end &&
		prevNode.source.start.line === prevNode.source.end.line
	);
}

module.exports = isAfterSingleLineComment;
