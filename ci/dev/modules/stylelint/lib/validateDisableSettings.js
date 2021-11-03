'use strict';

const _ = require('lodash');
const validateOptions = require('./utils/validateOptions');

/**
 * @typedef {import('stylelint').PostcssResult} PostcssResult
 * @typedef {import('stylelint').DisableOptions} DisableOptions
 * @typedef {import('stylelint').DisablePropertyName} DisablePropertyName
 * @typedef {import('stylelint').StylelintPostcssResult} StylelintPostcssResult
 */

/**
 * Validates that the stylelint config for `result` has a valid disable field
 * named `field`, and returns the result in normalized form as well as a
 * `StylelintPostcssResult` for convenience.
 *
 * Returns `null` if no disables should be reported, and automatically reports
 * an invalid configuration. If this returns non-`null`, it guarantees that
 * `result._postcssResult` is defined as well.
 *
 * @param {PostcssResult | undefined} result
 * @param {DisablePropertyName} field
 * @return {[boolean, Required<DisableOptions>, StylelintPostcssResult] | null}
 */
module.exports = function (result, field) {
	// Files with `CssSyntaxError`s don't have `_postcssResult`s.
	if (!result) return null;

	const stylelintResult = result.stylelint;

	// Files with linting errors may not have configs associated with them.
	if (!stylelintResult.config) return null;

	const rawSettings = stylelintResult.config[field];

	/** @type {boolean} */
	let enabled;
	/** @type {DisableOptions} */
	let options;

	if (Array.isArray(rawSettings)) {
		enabled = rawSettings[0];
		options = rawSettings[1] || {};
	} else {
		enabled = rawSettings || false;
		options = {};
	}

	const validOptions = validateOptions(
		result,
		field,
		{
			actual: enabled,
			possible: [true, false],
		},
		{
			actual: options,
			possible: {
				except: [_.isString, _.isRegExp],
			},
		},
	);

	if (!validOptions) return null;

	// If the check is disabled with no exceptions, there's no reason to run
	// it at all.
	if (!enabled && !options.except) return null;

	return [
		enabled,
		{
			except: options.except || [],
			severity: options.severity || stylelintResult.config.defaultSeverity || 'error',
		},
		stylelintResult,
	];
};
