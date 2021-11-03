'use strict';

/**
 * Check whether a math function is standard
 *
 * @param {string} mathFunction
 * @returns {boolean}
 */
module.exports = function isStandardSyntaxMathFunction(mathFunction) {
	// SCSS variable
	if (mathFunction.includes('$')) {
		return false;
	}

	// Less variable
	if (mathFunction.includes('@')) {
		return false;
	}

	return true;
};
