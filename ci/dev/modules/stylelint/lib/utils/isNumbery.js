'use strict';

/**
 * Check whether it's a number or a number-like string:
 * i.e. when coerced to a number it == itself.
 *
 * @param {string | number} value
 */
module.exports = function (value) {
	/* eslint-disable eqeqeq */
	return value.toString().trim().length !== 0 && Number(value) == value;
	/* eslint-enable eqeqeq */
};
