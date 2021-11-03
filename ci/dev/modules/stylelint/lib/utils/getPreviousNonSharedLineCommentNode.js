'use strict';

const _ = require('lodash');

/** @typedef {import('postcss').Node} Node */

/**
 * @param {Node} node
 */
function getNodeLine(node) {
	return _.get(node, 'source.start.line');
}

/**
 * @param {import('postcss').Node | void} node
 * @returns {Node | void}
 */
module.exports = function getPreviousNonSharedLineCommentNode(node) {
	if (node === undefined) {
		return undefined;
	}

	const previousNode = node.prev();

	if (!previousNode || _.get(previousNode, 'type') !== 'comment') {
		return previousNode;
	}

	if (getNodeLine(node) === getNodeLine(previousNode)) {
		return getPreviousNonSharedLineCommentNode(previousNode);
	}

	const previousNode2 = previousNode.prev();

	if (previousNode2 && getNodeLine(previousNode) === getNodeLine(previousNode2)) {
		return getPreviousNonSharedLineCommentNode(previousNode);
	}

	return previousNode;
};
