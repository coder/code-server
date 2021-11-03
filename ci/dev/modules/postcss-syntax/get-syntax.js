"use strict";
const path = require("path");
const reSyntaxCSS = /^(?:post)?css$/i;

function cssSyntax () {
	return {
		stringify: require("postcss/lib/stringify"),
		parse: require("postcss/lib/parse"),
	};
}

function normalize (syntax) {
	if (!syntax.parse) {
		syntax = {
			parse: syntax,
		};
	}
	return syntax;
}

function requireSyntax (syntax) {
	if (reSyntaxCSS.test(syntax)) {
		return cssSyntax();
	} else if (/^sugarss$/i.test(syntax)) {
		syntax = "sugarss";
	} else if (path.isAbsolute(syntax) || syntax[0] === ".") {
		syntax = path.resolve(syntax);
	} else {
		syntax = syntax.toLowerCase().replace(/^(?:postcss-)?(\w+)/i, "postcss-$1");
	}
	return normalize(require(syntax));
}

function getSyntax (lang, opts) {
	let syntax;
	lang = lang || "css";
	if (opts.syntax.config[lang]) {
		syntax = opts.syntax.config[lang];
		if (typeof syntax === "string") {
			if (syntax !== lang && opts.syntax.config[syntax]) {
				return getSyntax(syntax, opts);
			}
			syntax = requireSyntax(syntax);
		} else {
			syntax = normalize(syntax);
		}
	} else if (reSyntaxCSS.test(lang)) {
		syntax = cssSyntax();
	} else {
		return requireSyntax(lang);
	}
	if (!syntax.stringify) {
		if (reSyntaxCSS.test(lang)) {
			syntax.stringify = require("postcss/lib/stringify");
		} else {
			syntax.stringify = getSyntax(null, opts).stringify;
		}
	}
	opts.syntax.config[lang] = syntax;
	return syntax;
}

module.exports = getSyntax;
