'use strict';

/**
 * Check if a rule is a keyframe one
 *
 * @param {import('postcss').Rule} rule
 * @returns {boolean}
 */
module.exports = function (rule) {
	const parent = rule.parent;

	return parent.type === 'atrule' && parent.name.toLowerCase() === 'keyframes';
};
