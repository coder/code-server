"use strict";
const stringify = require("./stringify");
const parseStyle = require("./parse-style");
const normalOpts = require("./normal-opts");

module.exports = (extract, lang) => {
	const defaultConfig = {
		postcss: "css",
		stylus: "css",
		babel: "jsx",
		xml: "html",
	};
	function parse (source, opts) {
		source = source.toString();
		opts = normalOpts(opts, this);
		const document = parseStyle(source, opts, extract(source, opts));
		document.source.lang = lang;
		return document;
	}

	function initSyntax (syntax) {
		syntax.stringify = stringify.bind(syntax);
		syntax.parse = parse.bind(syntax);
		syntax.extract = extract.bind(syntax);
		return syntax;
	}

	function syntax (config) {
		return initSyntax({
			config: Object.assign({}, defaultConfig, config),
		});
	}

	initSyntax(syntax);
	syntax.config = defaultConfig;
	return syntax;
};
