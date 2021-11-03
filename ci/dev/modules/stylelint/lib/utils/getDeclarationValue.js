'use strict';

const _ = require('lodash');

/**
 * @param {import('postcss').Declaration} decl
 * @returns {string}
 */
module.exports = function getDeclarationValue(decl) {
	return _.get(decl, 'raws.value.raw', decl.value);
};
