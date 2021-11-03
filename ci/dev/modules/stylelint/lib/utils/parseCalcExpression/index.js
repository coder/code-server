'use strict';

// To generate parser.js run the following command in the current directory:
//
// npx jison-gho parser.jison -o parser.js

const parse = require('./parser').parse;

/**
 * @param {string} exp
 * @returns {object}
 */
module.exports = function parseCalcExpression(exp) {
	return parse(exp);
};
