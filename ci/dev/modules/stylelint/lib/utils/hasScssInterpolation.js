'use strict';

/**
 * Check whether a string has scss interpolation
 *
 * @param {string} string
 */
module.exports = function (string) {
	return /#{.+?}/.test(string);
};
