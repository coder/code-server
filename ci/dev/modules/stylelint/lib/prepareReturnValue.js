'use strict';

const descriptionlessDisables = require('./descriptionlessDisables');
const invalidScopeDisables = require('./invalidScopeDisables');
const needlessDisables = require('./needlessDisables');
const reportDisables = require('./reportDisables');

/** @typedef {import('stylelint').Formatter} Formatter */
/** @typedef {import('stylelint').StylelintResult} StylelintResult */
/** @typedef {import('stylelint').StylelintStandaloneOptions} StylelintStandaloneOptions */
/** @typedef {import('stylelint').StylelintStandaloneReturnValue} StylelintStandaloneReturnValue */

/**
 * @param {StylelintResult[]} stylelintResults
 * @param {StylelintStandaloneOptions} options
 * @param {Formatter} formatter
 *
 * @returns {StylelintStandaloneReturnValue}
 */
function prepareReturnValue(stylelintResults, options, formatter) {
	const { maxWarnings } = options;

	reportDisables(stylelintResults);
	needlessDisables(stylelintResults);
	invalidScopeDisables(stylelintResults);
	descriptionlessDisables(stylelintResults);

	const errored = stylelintResults.some(
		(result) =>
			result.errored ||
			result.parseErrors.length > 0 ||
			result.warnings.some((warning) => warning.severity === 'error'),
	);

	/** @type {StylelintStandaloneReturnValue} */
	const returnValue = {
		errored,
		results: [],
		output: '',
		reportedDisables: [],
	};

	if (maxWarnings !== undefined) {
		const foundWarnings = stylelintResults.reduce((count, file) => {
			return count + file.warnings.length;
		}, 0);

		if (foundWarnings > maxWarnings) {
			returnValue.maxWarningsExceeded = { maxWarnings, foundWarnings };
		}
	}

	returnValue.output = formatter(stylelintResults, returnValue);
	returnValue.results = stylelintResults;

	return returnValue;
}

module.exports = prepareReturnValue;
