'use strict';

const balancedMatch = require('balanced-match');

/**
 * Replace all of the characters that are arguments to a certain
 * CSS function with some innocuous character.
 *
 * This is useful if you need to use a RegExp to find a string
 * but want to ignore matches in certain functions (e.g. `url()`,
 * which might contain all kinds of false positives).
 *
 * For example:
 * blurFunctionArguments("abc url(abc) abc", "url") === "abc url(```) abc"
 *
 * @param {string} source
 * @param {string} functionName
 * @return {string} - The result string, with the function arguments "blurred"
 */
module.exports = function (source, functionName, blurChar = '`') {
	const nameWithParen = `${functionName.toLowerCase()}(`;
	const lowerCaseSource = source.toLowerCase();

	if (!lowerCaseSource.includes(nameWithParen)) {
		return source;
	}

	const functionNameLength = functionName.length;

	let result = source;
	let searchStartIndex = 0;

	while (lowerCaseSource.includes(nameWithParen, searchStartIndex)) {
		const openingParenIndex =
			lowerCaseSource.indexOf(nameWithParen, searchStartIndex) + functionNameLength;
		const parensMatch = balancedMatch('(', ')', lowerCaseSource.slice(openingParenIndex));

		if (!parensMatch) {
			throw new Error(`No parens match: "${source}"`);
		}

		const closingParenIndex = parensMatch.end + openingParenIndex;
		const argumentsLength = closingParenIndex - openingParenIndex - 1;

		result =
			result.slice(0, openingParenIndex + 1) +
			blurChar.repeat(argumentsLength) +
			result.slice(closingParenIndex);
		searchStartIndex = closingParenIndex;
	}

	return result;
};
