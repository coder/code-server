'use strict';

const balancedMatch = require('balanced-match');
const styleSearch = require('style-search');

/**
 * Search a CSS string for functions by name.
 * For every match, invoke the callback, passing the function's
 * "argument(s) string" (whatever is inside the parentheses)
 * as an argument.
 *
 * Callback will be called once for every matching function found,
 * with the function's "argument(s) string" and its starting index
 * as the arguments.
 *
 * @param {string} source
 * @param {string} functionName
 * @param {Function} callback
 */
module.exports = function (source, functionName, callback) {
	styleSearch(
		{
			source,
			target: functionName,
			functionNames: 'check',
		},
		(match) => {
			if (source[match.endIndex] !== '(') {
				return;
			}

			const parensMatch = balancedMatch('(', ')', source.substr(match.startIndex));

			if (!parensMatch) {
				throw new Error(`No parens match: "${source}"`);
			}

			callback(parensMatch.body, match.endIndex + 1);
		},
	);
};
