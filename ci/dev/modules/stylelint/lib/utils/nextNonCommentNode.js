'use strict';

/** @typedef {import('postcss').Node} PostcssNode */

/**
 * Get the next non-comment node in a PostCSS AST
 * at or after a given node.
 *
 * @param {PostcssNode | void} startNode
 * @returns {PostcssNode | null}
 */
module.exports = function nextNonCommentNode(startNode) {
	if (!startNode || !startNode.next) return null;

	if (startNode.type === 'comment') {
		return nextNonCommentNode(startNode.next());
	}

	return startNode;
};
