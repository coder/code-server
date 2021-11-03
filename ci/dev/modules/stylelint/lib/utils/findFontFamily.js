'use strict';

const isNumbery = require('./isNumbery');
const isStandardSyntaxValue = require('./isStandardSyntaxValue');
const isValidFontSize = require('./isValidFontSize');
const isVariable = require('./isVariable');
const keywordSets = require('../reference/keywordSets');
const postcssValueParser = require('postcss-value-parser');

const nodeTypesToCheck = new Set(['word', 'string', 'space', 'div']);

/** @typedef {import('postcss-value-parser').Node} Node */

/**
 *
 * @param {Node} firstNode
 * @param {Node} secondNode
 * @param {string | null} charactersBetween
 *
 * @returns {Node}
 */
function joinValueNodes(firstNode, secondNode, charactersBetween) {
	firstNode.value = firstNode.value + charactersBetween + secondNode.value;

	return firstNode;
}

/**
 * Get the font-families within a `font` shorthand property value.
 *
 * @param {string} value
 * @return {object} Collection font-family nodes
 */
module.exports = function findFontFamily(value) {
	/** @type {Node[]} */
	const fontFamilies = [];

	const valueNodes = postcssValueParser(value);

	// Handle `inherit`, `initial` and etc
	if (
		valueNodes.nodes.length === 1 &&
		keywordSets.basicKeywords.has(valueNodes.nodes[0].value.toLowerCase())
	) {
		return [valueNodes.nodes[0]];
	}

	let needMergeNodesByValue = false;
	/** @type {string | null} */
	let mergeCharacters = null;

	valueNodes.walk((valueNode, index, nodes) => {
		if (valueNode.type === 'function') {
			return false;
		}

		if (!nodeTypesToCheck.has(valueNode.type)) {
			return;
		}

		const valueLowerCase = valueNode.value.toLowerCase();

		// Ignore non standard syntax
		if (!isStandardSyntaxValue(valueLowerCase)) {
			return;
		}

		// Ignore variables
		if (isVariable(valueLowerCase)) {
			return;
		}

		// Ignore keywords for other font parts
		if (
			keywordSets.fontShorthandKeywords.has(valueLowerCase) &&
			!keywordSets.fontFamilyKeywords.has(valueLowerCase)
		) {
			return;
		}

		// Ignore font-sizes
		if (isValidFontSize(valueNode.value)) {
			return;
		}

		// Ignore anything come after a <font-size>/, because it's a line-height
		if (
			nodes[index - 1] &&
			nodes[index - 1].value === '/' &&
			nodes[index - 2] &&
			isValidFontSize(nodes[index - 2].value)
		) {
			return;
		}

		// Ignore number values
		if (isNumbery(valueLowerCase)) {
			return;
		}

		// Detect when a space or comma is dividing a list of font-families, and save the joining character.
		if (
			(valueNode.type === 'space' || (valueNode.type === 'div' && valueNode.value !== ',')) &&
			fontFamilies.length !== 0
		) {
			needMergeNodesByValue = true;
			mergeCharacters = valueNode.value;

			return;
		}

		if (valueNode.type === 'space' || valueNode.type === 'div') {
			return;
		}

		const fontFamily = valueNode;

		if (needMergeNodesByValue) {
			joinValueNodes(fontFamilies[fontFamilies.length - 1], valueNode, mergeCharacters);
			needMergeNodesByValue = false;
			mergeCharacters = null;
		} else {
			fontFamilies.push(fontFamily);
		}
	});

	return fontFamilies;
};
