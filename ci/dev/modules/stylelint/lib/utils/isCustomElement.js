'use strict';

const htmlTags = require('html-tags');
const keywordSets = require('../reference/keywordSets');
const mathMLTags = require('mathml-tag-names');
const svgTags = require('svg-tags');

/**
 * Check whether a type selector is a custom element
 *
 * @param {string} selector
 * @returns {boolean}
 */
module.exports = function (selector) {
	if (!/^[a-z]/.test(selector)) {
		return false;
	}

	if (!selector.includes('-')) {
		return false;
	}

	const selectorLowerCase = selector.toLowerCase();

	if (selectorLowerCase !== selector) {
		return false;
	}

	if (svgTags.includes(selectorLowerCase)) {
		return false;
	}

	if (htmlTags.includes(selectorLowerCase)) {
		return false;
	}

	if (keywordSets.nonStandardHtmlTags.has(selectorLowerCase)) {
		return false;
	}

	if (mathMLTags.includes(selectorLowerCase)) {
		return false;
	}

	return true;
};
