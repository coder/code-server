'use strict';

const hasBlock = require('./hasBlock');

/**
 * @param {import('postcss').AtRule | import('postcss-less').AtRule} atRule
 * @returns {boolean}
 */
module.exports = function (atRule) {
	return (
		(atRule.type === 'atrule' && 'variable' in atRule && atRule.variable && !hasBlock(atRule)) ||
		false
	);
};
