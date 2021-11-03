'use strict';

const _ = require('lodash');

/** @typedef {import('postcss').Node} Node */

/**
 * @param {Node | void} node
 */
function getNodeLine(node) {
	return _.get(node, 'source.start.line');
}

/**
 * @param {Node | void} node
 * @returns {Node | void}
 */
module.exports = function getNextNonSharedLineCommentNode(node) {
	if (node === undefined) {
		return undefined;
	}

	/** @type {Node | void} */
	const nextNode = node.next();

	if (_.get(nextNode, 'type') !== 'comment') {
		return nextNode;
	}

	if (
		getNodeLine(node) === getNodeLine(nextNode) ||
		(nextNode !== undefined && getNodeLine(nextNode) === getNodeLine(nextNode.next()))
	) {
		return getNextNonSharedLineCommentNode(nextNode);
	}

	return nextNode;
};
