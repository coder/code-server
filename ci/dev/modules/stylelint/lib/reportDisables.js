'use strict';

const _ = require('lodash');

/** @typedef {import('stylelint').RangeType} RangeType */
/** @typedef {import('stylelint').DisableReportRange} DisabledRange */

/**
 * Returns a report describing which `results` (if any) contain disabled ranges
 * for rules that disallow disables via `reportDisables: true`.
 *
 * @param {import('stylelint').StylelintResult[]} results
 */
module.exports = function (results) {
	results.forEach((result) => {
		// File with `CssSyntaxError` don't have `_postcssResult`s.
		if (!result._postcssResult) {
			return;
		}

		/** @type {{[ruleName: string]: Array<RangeType>}} */
		const rangeData = result._postcssResult.stylelint.disabledRanges;

		if (!rangeData) return;

		const config = result._postcssResult.stylelint.config;

		// If no rules actually disallow disables, don't bother looking for ranges
		// that correspond to disabled rules.
		if (!Object.values(_.get(config, 'rules', {})).some(reportDisablesForRule)) {
			return [];
		}

		Object.keys(rangeData).forEach((rule) => {
			rangeData[rule].forEach((range) => {
				if (!reportDisablesForRule(_.get(config, ['rules', rule], []))) return;

				// If the comment doesn't have a location, we can't report a useful error.
				// In practice we expect all comments to have locations, though.
				if (!range.comment.source || !range.comment.source.start) return;

				result.warnings.push({
					text: `Rule "${rule}" may not be disabled`,
					rule: 'reportDisables',
					line: range.comment.source.start.line,
					column: range.comment.source.start.column,
					severity: 'error',
				});
			});
		});
	});
};

/**
 * @param {[any, object]|null} options
 * @return {boolean}
 */
function reportDisablesForRule(options) {
	if (!options) return false;

	return _.get(options[1], 'reportDisables', false);
}
