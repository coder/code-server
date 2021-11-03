'use strict';

module.exports = require('@stylelint/postcss-markdown')({
	scss: require('postcss-scss'),
	less: require('postcss-less'),
	sass: require('postcss-sass'),
	sugarss: require('sugarss'),
});
