'use strict';

const _ = require('lodash');
const hasBlock = require('../utils/hasBlock');

/**
 * Check whether a Node is a custom property set
 *
 * @param {import('postcss').Rule} node
 * @returns {boolean}
 */
module.exports = function (node) {
	const selector = _.get(node, 'raws.selector.raw', node.selector);

	return (
		node.type === 'rule' && hasBlock(node) && selector.startsWith('--') && selector.endsWith(':')
	);
};
