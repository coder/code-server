'use strict';

const _ = require('lodash');
const optionsMatches = require('./utils/optionsMatches');
const putIfAbsent = require('./utils/putIfAbsent');
const validateDisableSettings = require('./validateDisableSettings');

/** @typedef {import('postcss/lib/comment')} PostcssComment */
/** @typedef {import('stylelint').DisabledRange} DisabledRange */
/** @typedef {import('stylelint').RangeType} RangeType */
/** @typedef {import('stylelint').DisableReportRange} DisableReportRange */

/**
 * @param {import('stylelint').StylelintResult[]} results
 */
module.exports = function (results) {
	results.forEach((result) => {
		const settings = validateDisableSettings(result._postcssResult, 'reportNeedlessDisables');

		if (!settings) return;

		const [enabled, options, stylelintResult] = settings;

		/** @type {{[ruleName: string]: Array<DisabledRange>}} */
		const rangeData = _.cloneDeep(stylelintResult.disabledRanges);

		if (!rangeData) return;

		const disabledWarnings = stylelintResult.disabledWarnings || [];

		// A map from `stylelint-disable` comments to the set of rules that
		// are usefully disabled by each comment. We track this
		// comment-by-comment rather than range-by-range because ranges that
		// disable *all* rules are duplicated for each rule they apply to in
		// practice.
		/** @type {Map<PostcssComment, Set<string>>}} */
		const usefulDisables = new Map();

		for (const warning of disabledWarnings) {
			const rule = warning.rule;
			const ruleRanges = rangeData[rule];

			if (ruleRanges) {
				for (const range of ruleRanges) {
					if (isWarningInRange(warning, range)) {
						putIfAbsent(usefulDisables, range.comment, () => new Set()).add(rule);
					}
				}
			}

			for (const range of rangeData.all) {
				if (isWarningInRange(warning, range)) {
					putIfAbsent(usefulDisables, range.comment, () => new Set()).add(rule);
				}
			}
		}

		const rangeEntries = Object.entries(rangeData);

		// Get rid of the duplicated ranges for each `all` rule. We only care
		// if the entire `all` rule is useful as a whole or not.
		for (const range of rangeData.all) {
			for (const [rule, ranges] of rangeEntries) {
				if (rule === 'all') continue;

				_.remove(ranges, (otherRange) => range.comment === otherRange.comment);
			}
		}

		for (const [rule, ranges] of rangeEntries) {
			for (const range of ranges) {
				if (enabled === optionsMatches(options, 'except', rule)) continue;

				const useful = usefulDisables.get(range.comment) || new Set();

				// Only emit a warning if this range's comment isn't useful for this rule.
				// For the special rule "all", only emit a warning if it's not useful for
				// *any* rules, because it covers all of them.
				if (rule === 'all' ? useful.size !== 0 : useful.has(rule)) continue;

				// If the comment doesn't have a location, we can't report a useful error.
				// In practice we expect all comments to have locations, though.
				if (!range.comment.source || !range.comment.source.start) continue;

				result.warnings.push({
					text: `Needless disable for "${rule}"`,
					rule: '--report-needless-disables',
					line: range.comment.source.start.line,
					column: range.comment.source.start.column,
					severity: options.severity,
				});
			}
		}
	});
};

/**
 * @param {import('stylelint').DisabledWarning} warning
 * @param {RangeType} range
 * @return {boolean}
 */
function isWarningInRange(warning, range) {
	const line = warning.line;

	// Need to check if range.end exist, because line number type cannot be compared to undefined
	return (
		range.start <= line &&
		((range.end !== undefined && range.end >= line) || range.end === undefined)
	);
}
