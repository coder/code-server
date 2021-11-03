'use strict';

const hasLessInterpolation = require('../utils/hasLessInterpolation');
const hasPsvInterpolation = require('../utils/hasPsvInterpolation');
const hasScssInterpolation = require('../utils/hasScssInterpolation');
const hasTplInterpolation = require('../utils/hasTplInterpolation');

/**
 * Check whether a string has interpolation
 *
 * @param {string} string
 * @return {boolean} If `true`, a string has interpolation
 */
module.exports = function (string) {
	// SCSS or Less interpolation
	if (
		hasLessInterpolation(string) ||
		hasScssInterpolation(string) ||
		hasTplInterpolation(string) ||
		hasPsvInterpolation(string)
	) {
		return true;
	}

	return false;
};
