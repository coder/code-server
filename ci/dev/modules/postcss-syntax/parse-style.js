"use strict";
const reNewLine = /(?:\r?\n|\r)/gm;
const Input = require("postcss/lib/input");
const Document = require("./document");
const getSyntax = require("./get-syntax");
const patch = require("./patch-postcss");

class LocalFixer {
	constructor (lines, style) {
		let line = 0;
		let column = style.startIndex;
		lines.some((lineEndIndex, lineNumber) => {
			if (lineEndIndex >= style.startIndex) {
				line = lineNumber--;
				if (lineNumber in lines) {
					column = style.startIndex - lines[lineNumber] - 1;
				}
				return true;
			}
		});

		this.line = line;
		this.column = column;
		this.style = style;
	}
	object (object) {
		if (object) {
			if (object.line === 1) {
				object.column += this.column;
			}
			object.line += this.line;
		}
	}
	node (node) {
		this.object(node.source.start);
		this.object(node.source.end);
	}
	root (root) {
		this.node(root);
		root.walk(node => {
			this.node(node);
		});
	}
	error (error) {
		if (error && error.name === "CssSyntaxError") {
			this.object(error);
			this.object(error.input);
			error.message = error.message.replace(/:\d+:\d+:/, ":" + error.line + ":" + error.column + ":");
		}
		return error;
	}
	parse (opts) {
		const style = this.style;
		const syntax = style.syntax || getSyntax(style.lang, opts);
		let root = style.root;
		try {
			root = syntax.parse(style.content, Object.assign({}, opts, {
				map: false,
			}, style.opts));
		} catch (error) {
			if (style.ignoreErrors) {
				return;
			} else if (!style.skipConvert) {
				this.error(error);
			}
			throw error;
		}
		if (!style.skipConvert) {
			this.root(root);
		}

		root.source.inline = Boolean(style.inline);
		root.source.lang = style.lang;
		root.source.syntax = syntax;
		return root;
	}
}

function docFixer (source, opts) {
	let match;
	const lines = [];
	reNewLine.lastIndex = 0;
	while ((match = reNewLine.exec(source))) {
		lines.push(match.index);
	}
	lines.push(source.length);
	return function parseStyle (style) {
		return new LocalFixer(lines, style).parse(opts);
	};
}

function parseStyle (source, opts, styles) {
	patch(Document);

	const document = new Document();

	let index = 0;
	if (styles.length) {
		const parseStyle = docFixer(source, opts);
		styles.sort((a, b) => (
			a.startIndex - b.startIndex
		)).forEach(style => {
			const root = parseStyle(style);
			if (root) {
				root.raws.beforeStart = source.slice(index, style.startIndex);
				if (style.endIndex) {
					index = style.endIndex;
				} else {
					index = style.startIndex + (style.content || root.source.input.css).length;
				}
				root.document = document;
				document.nodes.push(root);
			}
		});
	}
	document.raws.afterEnd = index ? source.slice(index) : source;
	document.source = {
		input: new Input(source, opts),
		start: {
			line: 1,
			column: 1,
		},
		opts,
	};
	return document;
}
module.exports = parseStyle;
