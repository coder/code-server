'use strict';

const hasInterpolation = require('../utils/hasInterpolation');

/**
 * Check whether a value is standard
 *
 * @param {string} value
 * @returns {boolean}
 */
module.exports = function (value) {
	let normalizedValue = value;

	// Ignore operators before variables (example -$variable)
	if (/^[-+*/]/.test(value[0])) {
		normalizedValue = normalizedValue.slice(1);
	}

	// SCSS variable (example $variable)
	if (normalizedValue.startsWith('$')) {
		return false;
	}

	// SCSS namespace (example namespace.$variable)
	if (/^.+\.\$/.test(value)) {
		return false;
	}

	// Less variable
	if (normalizedValue.startsWith('@')) {
		return false;
	}

	// SCSS or Less interpolation
	if (hasInterpolation(normalizedValue)) {
		return false;
	}

	// WebExtension replacement keyword used by Chrome/Firefox
	// more information: https://developer.chrome.com/extensions/i18n
	// and https://github.com/stylelint/stylelint/issues/4707
	if (/__MSG_\S+__/.test(value)) {
		return false;
	}

	return true;
};
