'use strict';

const hasInterpolation = require('../utils/hasInterpolation');

/**
 * Check whether a media feature is standard
 *
 * @param {string} mediaFeature
 * @returns {boolean}
 */
module.exports = function (mediaFeature) {
	// Remove outside parens
	mediaFeature = mediaFeature.slice(1, -1);

	// Parentheticals used for non-standard operations e.g. ($var - 10)
	if (mediaFeature.includes('(')) {
		return false;
	}

	// SCSS or Less interpolation
	if (hasInterpolation(mediaFeature)) {
		return false;
	}

	return true;
};
