'use strict';

/**
 * Remove empty lines before a node. Mutates the node.
 *
 * @param {import('postcss').Node} node
 * @param {'\n' | '\r\n'} newline
 */
function removeEmptyLinesBefore(node, newline) {
	node.raws.before = node.raws.before ? node.raws.before.replace(/(\r?\n\s*\r?\n)+/g, newline) : '';

	return node;
}

module.exports = removeEmptyLinesBefore;
