"use strict";

function stringify (document) {
	let stringify;
	if (document instanceof require("./document")) {
		stringify = docStringify;
	} else {
		stringify = document.source.syntax.stringify;
	}
	return stringify.apply(this, arguments);
}

function docStringify (document, builder) {
	document.nodes.forEach((root, i) => {
		builder(root.raws.beforeStart, root, "beforeStart");
		root.source.syntax && root.source.syntax.stringify(root, builder);
	});
	builder(document.raws.afterEnd, document, "afterEnd");
}
module.exports = stringify;
