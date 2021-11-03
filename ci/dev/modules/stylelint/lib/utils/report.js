'use strict';

const _ = require('lodash');

/** @typedef {{
  ruleName: string,
  result: import('stylelint').PostcssResult,
  message: string,
  node: import('postcss').Node & {
    positionBy(opts: { index?: number, word?: string }): { line: number, column: number }
  },
  index?: number,
  word?: string,
  line?: number
}} Violation */

/**
 * Report a violation.
 *
 * This function accounts for `disabledRanges` attached to the result.
 * That is, if the reported violation is within a disabledRange,
 * it is ignored. Otherwise, it is attached to the result as a
 * postcss warning.
 *
 * It also accounts for the rule's severity.
 *
 * You *must* pass *either* a node or a line number.
 * @param {Violation} violation
 */
module.exports = function (violation) {
	const ruleName = violation.ruleName;
	const result = violation.result;
	const message = violation.message;
	const line = violation.line;
	const node = violation.node;
	const index = violation.index;
	const word = violation.word;

	result.stylelint = result.stylelint || {
		ruleSeverities: {},
		customMessages: {},
	};

	// In quiet mode, mere warnings are ignored
	if (result.stylelint.quiet && result.stylelint.ruleSeverities[ruleName] !== 'error') {
		return;
	}

	// If a line is not passed, use the node.positionBy method to get the
	// line number that the complaint pertains to
	const startLine = line || node.positionBy({ index }).line;

	const { ignoreDisables } = result.stylelint.config || {};

	if (result.stylelint.disabledRanges) {
		const ranges = result.stylelint.disabledRanges[ruleName] || result.stylelint.disabledRanges.all;

		for (const range of ranges) {
			if (
				// If the violation is within a disabledRange,
				// and that disabledRange's rules include this one,
				// do not register a warning
				range.start <= startLine &&
				(range.end === undefined || range.end >= startLine) &&
				(!range.rules || range.rules.includes(ruleName))
			) {
				// Collect disabled warnings
				// Used to report `needlessDisables` in subsequent processing.
				const disabledWarnings =
					result.stylelint.disabledWarnings || (result.stylelint.disabledWarnings = []);

				disabledWarnings.push({
					rule: ruleName,
					line: startLine,
				});

				if (!ignoreDisables) {
					return;
				}

				break;
			}
		}
	}

	const severity = _.get(result.stylelint, ['ruleSeverities', ruleName]);

	if (!result.stylelint.stylelintError && severity === 'error') {
		result.stylelint.stylelintError = true;
	}

	/** @type {import('stylelint').StylelintWarningOptions} */
	const warningProperties = {
		severity,
		rule: ruleName,
	};

	if (node) {
		warningProperties.node = node;
	}

	if (index) {
		warningProperties.index = index;
	}

	if (word) {
		warningProperties.word = word;
	}

	const warningMessage = _.get(result.stylelint, ['customMessages', ruleName], message);

	result.warn(warningMessage, warningProperties);
};
