'use strict';

/**
 * Check whether a property is a custom one
 * @param {string} property
 * @returns {boolean}
 */
module.exports = function (property) {
	return property.startsWith('--');
};
