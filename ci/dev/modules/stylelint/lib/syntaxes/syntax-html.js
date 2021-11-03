'use strict';

module.exports = require('postcss-html')({
	scss: require('postcss-scss'),
	less: require('postcss-less'),
	sass: require('postcss-sass'),
	sugarss: require('sugarss'),
});
