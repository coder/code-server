'use strict';

const _ = require('lodash');
const rules = require('./rules');

// Rule settings can take a number of forms, e.g.
// a. "rule-name": null
// b. "rule-name": [null, ...]
// c. "rule-name": primaryOption
// d. "rule-name": [primaryOption]
// e. "rule-name": [primaryOption, secondaryOption]
// Where primaryOption can be anything: primitive, Object, or Array.

/**
 * This function normalizes all the possibilities into the
 * standard form: [primaryOption, secondaryOption]
 * Except in the cases with null, a & b, in which case
 * null is returned
 * @template T
 * @template {Object} O
 * @param {import('stylelint').StylelintConfigRuleSettings<T, O>} rawSettings
 * @param {string} ruleName
 * @param {boolean} [primaryOptionArray] If primaryOptionArray is not provided, we try to get it from the rules themselves, which will not work for plugins
 * @return {[T] | [T, O] | null}
 */
module.exports = function (
	rawSettings,
	ruleName,
	// If primaryOptionArray is not provided, we try to get it from the
	// rules themselves, which will not work for plugins
	primaryOptionArray,
) {
	if (_.isNil(rawSettings)) {
		return null;
	}

	if (!Array.isArray(rawSettings)) {
		return [rawSettings];
	}
	// Everything below is an array ...

	if (!_.isEmpty(rawSettings) && _.isNil(rawSettings[0])) {
		return null;
	}

	if (primaryOptionArray === undefined) {
		const rule = rules[ruleName];

		primaryOptionArray = _.get(rule, 'primaryOptionArray');
	}

	if (!primaryOptionArray) {
		return rawSettings;
	}
	// Everything below is a rule that CAN have an array for a primary option ...
	// (they might also have something else, e.g. rule-properties-order can
	// have the string "alphabetical")

	if (rawSettings.length === 1 && Array.isArray(rawSettings[0])) {
		return rawSettings;
	}

	if (
		rawSettings.length === 2 &&
		!_.isPlainObject(rawSettings[0]) &&
		_.isPlainObject(rawSettings[1])
	) {
		return rawSettings;
	}

	// `T` must be an array type, but TSC thinks it's probably invalid to
	// cast `[T]` to `T` so we cast through `any` first.
	return [/** @type {T} */ (/** @type {any} */ (rawSettings))];
};
