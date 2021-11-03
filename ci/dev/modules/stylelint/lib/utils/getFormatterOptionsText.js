'use strict';

const formatters = require('../formatters');

/**
 * @param {{ useOr?: boolean }} [options={}]
 * @returns {string}
 */
module.exports = function getFormatterOptionsText(options = {}) {
	let output = Object.keys(formatters)
		.map((name) => `"${name}"`)
		.join(', ');

	if (options.useOr) {
		output = output.replace(/, ([a-z"]+)$/u, ' or $1');
	}

	return output;
};
