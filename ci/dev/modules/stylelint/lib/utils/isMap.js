'use strict';

/** @typedef {import('postcss-value-parser').Node} ValueNode */

/**
 * @param {ValueNode | undefined} valueNode
 * @returns {boolean}
 */
module.exports = function (valueNode) {
	if (!valueNode) {
		return false;
	}

	if (valueNode.type !== 'function' || !valueNode.nodes || valueNode.value) {
		return false;
	}

	// It's necessary to remove comments and spaces if they are present
	const cleanNodes = valueNode.nodes.filter(
		(node) => node.type !== 'comment' && node.type !== 'space',
	);

	// Map without comments and spaces will have the structure like $map (prop: value, prop2: value)
	//                                                                     ↑  ↑   ↑  ↑
	//                                                                     0  1   2  3
	if (cleanNodes[0] && cleanNodes[0].type !== 'word' && cleanNodes[0].type !== 'string') {
		return false;
	}

	if (cleanNodes[1] && cleanNodes[1].value !== ':') {
		return false;
	}

	// There is no need to check type or value of this node since it could be anything
	if (!cleanNodes[2]) {
		return false;
	}

	if (cleanNodes[3] && cleanNodes[3].value !== ',') {
		return false;
	}

	return true;
};
