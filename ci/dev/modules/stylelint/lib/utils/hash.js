'use strict';

const murmur = require('imurmurhash');

/**
 * hash the given string
 * @param  {string} str the string to hash
 * @returns {string} the hash
 */
module.exports = function hash(str) {
	return murmur(str).result().toString(36);
};
