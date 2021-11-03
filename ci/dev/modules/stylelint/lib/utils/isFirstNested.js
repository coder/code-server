'use strict';

const { isComment, hasSource } = require('./typeGuards');

/**
 * @param {import('postcss').Node} statement
 * @returns {boolean}
 */
module.exports = function (statement) {
	const parentNode = statement.parent;

	if (parentNode === undefined || parentNode.type === 'root') {
		return false;
	}

	if (statement === parentNode.first) {
		return true;
	}

	/*
	 * Search for the statement in the parent's nodes, ignoring comment
	 * nodes on the same line as the parent's opening brace.
	 */

	const parentNodes = parentNode.nodes;

	if (!parentNodes) {
		return false;
	}

	const firstNode = parentNodes[0];

	if (
		!isComment(firstNode) ||
		(typeof firstNode.raws.before === 'string' && firstNode.raws.before.includes('\n'))
	) {
		return false;
	}

	if (!hasSource(firstNode) || !firstNode.source.start) {
		return false;
	}

	const openingBraceLine = firstNode.source.start.line;

	if (!firstNode.source.end || openingBraceLine !== firstNode.source.end.line) {
		return false;
	}

	for (let i = 1; i < parentNodes.length; i++) {
		const node = parentNodes[i];

		if (node === statement) {
			return true;
		}

		if (
			!isComment(node) ||
			(hasSource(node) && node.source.end && node.source.end.line !== openingBraceLine)
		) {
			return false;
		}
	}

	/* istanbul ignore next: Should always return in the loop */
	return false;
};
