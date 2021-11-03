'use strict';

/** @typedef {import('postcss').Node} Node */
/** @typedef {import('postcss').Node} NodeSource */

/**
 * @param {Node} node
 * @returns {node is import('postcss').Root}
 */
module.exports.isRoot = function isRoot(node) {
	return node.type === 'root';
};

/**
 * @param {Node} node
 * @returns {node is import('postcss').Rule}
 */
module.exports.isRule = function isRule(node) {
	return node.type === 'rule';
};

/**
 * @param {Node} node
 * @returns {node is import('postcss').AtRule}
 */
module.exports.isAtRule = function isAtRule(node) {
	return node.type === 'atrule';
};

/**
 * @param {Node} node
 * @returns {node is import('postcss').Comment}
 */
module.exports.isComment = function isComment(node) {
	return node.type === 'comment';
};

/**
 * @param {Node} node
 * @returns {node is (Node & {source: NodeSource})}
 */
module.exports.hasSource = function hasSource(node) {
	return Boolean(node.source);
};
