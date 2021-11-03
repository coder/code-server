'use strict';

/**
 * Create configurationError from text and set CLI exit code
 * @param {string} text
 * @returns {Object}
 */
module.exports = function (text) /* Object */ {
	/** @type {Error & {code?: number}} */
	const err = new Error(text);

	err.code = 78;

	return err;
};
