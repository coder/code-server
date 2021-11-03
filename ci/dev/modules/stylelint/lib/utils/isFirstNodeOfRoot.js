'use strict';

const { isRoot } = require('./typeGuards');

/**
 * @param {import('postcss').Node} node
 * @returns {boolean}
 */
module.exports = function (node) {
	if (isRoot(node)) return false;

	const parentNode = node.parent;

	return isRoot(parentNode) && node === parentNode.first;
};
