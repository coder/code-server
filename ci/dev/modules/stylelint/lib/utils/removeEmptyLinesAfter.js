'use strict';

/**
 * Remove empty lines before a node. Mutates the node.
 *
 * @param {import('postcss').Node} node
 * @param {'\n' | '\r\n'} newline
 */
function removeEmptyLinesAfter(node, newline) {
	node.raws.after = node.raws.after ? node.raws.after.replace(/(\r?\n\s*\r?\n)+/g, newline) : '';

	return node;
}

module.exports = removeEmptyLinesAfter;
