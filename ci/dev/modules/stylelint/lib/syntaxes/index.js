'use strict';

// Use this require pattern so that syntaxes can be bundled separately
const importLazy = require('import-lazy')(require);

/** @typedef {import('../getPostcssResult').Syntax} Syntax */
/** @type {{[k: string]: Syntax}} */
module.exports = {
	'css-in-js': importLazy('./syntax-css-in-js'),
	html: importLazy('./syntax-html'),
	less: importLazy('./syntax-less'),
	markdown: importLazy('./syntax-markdown'),
	sass: importLazy('./syntax-sass'),
	scss: importLazy('./syntax-scss'),
	sugarss: importLazy('./syntax-sugarss'),
};
