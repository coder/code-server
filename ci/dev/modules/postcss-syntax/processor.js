"use strict";

const parseStyle = require("./parse-style");

function getSyntax (config, syntax) {
	if (typeof syntax !== "string") {
		return syntax;
	}
	let syntaxConfig = config[syntax];

	if (syntaxConfig) {
		syntaxConfig = getSyntax(config, syntaxConfig);
	} else {
		syntaxConfig = {
			extract: require(syntax.toLowerCase().replace(/^(postcss-)?/i, "postcss-") + "/extract"),
		};
		config[syntax] = syntaxConfig;
	}

	return syntaxConfig;
}

function processor (source, lang, opts) {
	const syntax = getSyntax(opts.syntax.config, lang);
	const styles = (syntax.extract || syntax)(source, opts) || [];
	return parseStyle(source, opts, styles);
}

module.exports = processor;
