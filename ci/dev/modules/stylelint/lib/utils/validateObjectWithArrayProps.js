'use strict';

const _ = require('lodash');

/**
 * @template T
 * @typedef {(i: T) => boolean} Validator
 */

/**
 * Check whether the variable is an object and all it's properties are arrays of string values:
 *
 * ignoreProperties = {
 *   value1: ["item11", "item12", "item13"],
 *   value2: ["item21", "item22", "item23"],
 *   value3: ["item31", "item32", "item33"],
 * }
 * @template T
 * @param {Validator<T>|Validator<T>[]} validator
 * @returns {(value: {[k: any]: T|T[]}) => boolean}
 */
module.exports = (validator) => (value) => {
	if (!_.isPlainObject(value)) {
		return false;
	}

	return Object.values(value).every((array) => {
		if (!Array.isArray(array)) {
			return false;
		}

		// Make sure the array items are strings
		return array.every((item) => {
			if (Array.isArray(validator)) {
				return validator.some((v) => v(item));
			}

			return validator(item);
		});
	});
};
