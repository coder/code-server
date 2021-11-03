'use strict';

/**
 * @param {string} source
 *
 * @returns {string}
 */
module.exports = function (source, blurChar = ' ') {
	return source.replace(/[#@{}]+/g, blurChar);
};
