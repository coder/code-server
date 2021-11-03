"use strict";

function normalOpts (opts, syntax) {
	if (!opts) {
		opts = {};
	}
	opts.syntax = syntax;
	return opts;
}

module.exports = normalOpts;
