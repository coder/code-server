'use strict';

const optionsMatches = require('./utils/optionsMatches');
const validateDisableSettings = require('./validateDisableSettings');

/** @typedef {import('stylelint').RangeType} RangeType */

/**
 * @param {import('stylelint').StylelintResult[]} results
 */
module.exports = function (results) {
	results.forEach((result) => {
		const settings = validateDisableSettings(result._postcssResult, 'reportInvalidScopeDisables');

		if (!settings) return;

		const [enabled, options, stylelintResult] = settings;

		const configRules = (stylelintResult.config || {}).rules || {};

		const usedRules = new Set(Object.keys(configRules));

		usedRules.add('all');

		const rangeData = stylelintResult.disabledRanges;
		const disabledRules = Object.keys(rangeData);

		disabledRules.forEach((rule) => {
			if (usedRules.has(rule)) return;

			if (enabled === optionsMatches(options, 'except', rule)) return;

			rangeData[rule].forEach((range) => {
				if (!range.strictStart && !range.strictEnd) return;

				// If the comment doesn't have a location, we can't report a useful error.
				// In practice we expect all comments to have locations, though.
				if (!range.comment.source || !range.comment.source.start) return;

				result.warnings.push({
					text: `Rule "${rule}" isn't enabled`,
					rule: '--report-invalid-scope-disables',
					line: range.comment.source.start.line,
					column: range.comment.source.start.column,
					severity: options.severity,
				});
			});
		});
	});
};
