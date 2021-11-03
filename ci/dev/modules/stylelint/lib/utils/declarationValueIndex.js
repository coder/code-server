'use strict';

const _ = require('lodash');

/**
 * Get the index of a declaration's value
 *
 * @param {import('postcss').Declaration} decl
 *
 * @returns {number}
 */
module.exports = function (decl) {
	return [
		_.get(decl, 'raws.prop.prefix'),
		_.get(decl, 'raws.prop.raw', decl.prop),
		_.get(decl, 'raws.prop.suffix'),
		_.get(decl, 'raws.between', ':'),
		_.get(decl, 'raws.value.prefix'),
	].reduce((count, str) => {
		if (str) {
			return count + str.length;
		}

		return count;
	}, 0);
};
