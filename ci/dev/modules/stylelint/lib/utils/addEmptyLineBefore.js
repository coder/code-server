'use strict';

/** @typedef {import('postcss').ChildNode} ChildNode */

/**
 * Add an empty line before a node. Mutates the node.
 *
 * @param {ChildNode} node
 * @param {'\n' | '\r\n'} newline
 * @returns {ChildNode}
 */
function addEmptyLineBefore(node, newline) {
	if (node.raws.before === undefined) {
		return node;
	}

	if (!/\r?\n/.test(node.raws.before)) {
		node.raws.before = newline.repeat(2) + node.raws.before;
	} else {
		node.raws.before = node.raws.before.replace(/(\r?\n)/, `${newline}$1`);
	}

	return node;
}

module.exports = addEmptyLineBefore;
