'use strict';

const hasInterpolation = require('../utils/hasInterpolation');
const isScssVariable = require('./isScssVariable');

/**
 * Check whether a property is standard
 *
 * @param {string} property
 * @returns {boolean}
 */
module.exports = function (property) {
	// SCSS var
	if (isScssVariable(property)) {
		return false;
	}

	// Less var (e.g. @var: x)
	if (property.startsWith('@')) {
		return false;
	}

	// Less append property value with space (e.g. transform+_: scale(2))
	if (property.endsWith('+') || property.endsWith('+_')) {
		return false;
	}

	// SCSS or Less interpolation
	if (hasInterpolation(property)) {
		return false;
	}

	return true;
};
