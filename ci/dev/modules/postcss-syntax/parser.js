"use strict";

const getSyntax = require("./get-syntax");
const patch = require("./patch-postcss");

function parser (source, lang, opts) {
	patch();

	const syntax = getSyntax(lang, opts);
	const root = syntax.parse(source, opts);

	root.source.syntax = syntax;
	root.source.lang = lang;

	return root;
}

module.exports = parser;
