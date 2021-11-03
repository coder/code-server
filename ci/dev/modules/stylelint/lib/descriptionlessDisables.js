'use strict';

const optionsMatches = require('./utils/optionsMatches');
const validateDisableSettings = require('./validateDisableSettings');

/** @typedef {import('postcss/lib/comment')} PostcssComment */
/** @typedef {import('stylelint').RangeType} RangeType */
/** @typedef {import('stylelint').DisableReportRange} DisableReportRange */
/** @typedef {import('stylelint').StylelintDisableOptionsReport} StylelintDisableOptionsReport */

/**
 * @param {import('stylelint').StylelintResult[]} results
 */
module.exports = function (results) {
	results.forEach((result) => {
		const settings = validateDisableSettings(
			result._postcssResult,
			'reportDescriptionlessDisables',
		);

		if (!settings) return;

		const [enabled, options, stylelintResult] = settings;

		const rangeData = stylelintResult.disabledRanges;

		/** @type {Set<PostcssComment>} */
		const alreadyReported = new Set();

		Object.keys(rangeData).forEach((rule) => {
			rangeData[rule].forEach((range) => {
				if (range.description) return;

				if (alreadyReported.has(range.comment)) return;

				if (enabled === optionsMatches(options, 'except', rule)) {
					// An 'all' rule will get copied for each individual rule. If the
					// configuration is `[false, {except: ['specific-rule']}]`, we
					// don't want to report the copies that match except, so we record
					// the comment as already reported.
					if (!enabled && rule === 'all') alreadyReported.add(range.comment);

					return;
				}

				alreadyReported.add(range.comment);

				// If the comment doesn't have a location, we can't report a useful error.
				// In practice we expect all comments to have locations, though.
				if (!range.comment.source || !range.comment.source.start) return;

				result.warnings.push({
					text: `Disable for "${rule}" is missing a description`,
					rule: '--report-descriptionless-disables',
					line: range.comment.source.start.line,
					column: range.comment.source.start.column,
					severity: options.severity,
				});
			});
		});
	});
};
