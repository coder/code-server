'use strict';

/**
 * Omit any properties starting with `_`, which are fake-private
 *
 * @type {import('stylelint').Formatter}
 */
module.exports = function jsonFormatter(results) {
	const cleanedResults = results.map((result) =>
		Object.entries(result)
			.filter(([key]) => !key.startsWith('_'))
			.reduce((/** @type {{ [key: string]: any }} */ obj, [key, value]) => {
				obj[key] = value;

				return obj;
			}, {}),
	);

	return JSON.stringify(cleanedResults);
};
