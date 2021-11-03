'use strict';

/**
 * Check whether a property is SCSS variable
 *
 * @param {string} property
 * @returns {boolean}
 */
module.exports = function (property) {
	// SCSS var (e.g. $var: x), list (e.g. $list: (x)) or map (e.g. $map: (key:value))
	if (property.startsWith('$')) {
		return true;
	}

	// SCSS var within a namespace (e.g. namespace.$var: x)
	if (property.includes('.$')) {
		return true;
	}

	return false;
};
