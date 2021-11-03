'use strict';

const Literal = require('./literal');
const postcssParse = require('postcss/lib/parse');
const reNewLine = /(?:\r?\n|\r)/gm;
const isLiteral = (token) => token[0] === 'word' && /^\$\{[\s\S]*\}$/.test(token[1]);

function literal(start) {
	if (!isLiteral(start)) {
		return;
	}

	const tokens = [];
	let hasWord;
	let type;
	let token;

	while ((token = this.tokenizer.nextToken())) {
		tokens.push(token);
		type = token[0];

		if (type.length === 1) {
			break;
		} else if (type === 'word') {
			hasWord = true;
		}
	}

	while (tokens.length) {
		this.tokenizer.back(tokens.pop());
	}

	if (type === '{' || (type === ':' && !hasWord)) {
		return;
	}

	const node = new Literal({
		text: start[1],
	});

	this.init(node, start[2], start[3]);

	const input = this.input;

	if (input.templateLiteralStyles) {
		const offset = input.quasis[0].start;
		const nodeIndex = getNodeIndex(node, input);
		const start = offset + nodeIndex;
		const end = start + node.text.length;
		const templateLiteralStyles = input.templateLiteralStyles.filter(
			(style) => style.startIndex <= end && start < style.endIndex,
		);

		if (templateLiteralStyles.length) {
			const nodes = parseTemplateLiteralStyles(templateLiteralStyles, input, [
				nodeIndex,
				nodeIndex + node.text.length,
			]);

			if (nodes.length) {
				node.nodes = nodes;
				nodes.forEach((n) => (n.parent = node));
			}
		}
	}

	return node;
}

function freeSemicolon(token) {
	this.spaces += token[1];
	const nodes = this.current.nodes;
	const prev = nodes && nodes[nodes.length - 1];

	if (prev && /^(rule|literal)$/.test(prev.type) && !prev.raws.ownSemicolon) {
		prev.raws.ownSemicolon = this.spaces;
		this.spaces = '';
	}
}

module.exports = {
	freeSemicolon,
	literal,
};

function parseTemplateLiteralStyles(styles, input, range) {
	const offset = input.quasis[0].start;
	const source = input.css;

	const opts = Object.assign({}, input.parseOptions);

	delete opts.templateLiteralStyles;
	delete opts.expressions;
	delete opts.quasis;

	const parseStyle = docFixer(offset, source, opts);

	const nodes = [];
	let index = range[0];

	styles
		.sort((a, b) => a.startIndex - b.startIndex)
		.forEach((style) => {
			const root = parseStyle(style);

			if (!root || !root.nodes.length) {
				return;
			}

			root.raws.beforeStart = source.slice(index, style.startIndex - offset);
			root.raws.afterEnd = '';

			if (style.endIndex) {
				index = style.endIndex - offset;
			} else {
				index = style.startIndex - offset + (style.content || root.source.input.css).length;
			}

			nodes.push(root);
		});

	if (nodes.length) {
		nodes[nodes.length - 1].raws.afterEnd = source.slice(index, range[1]);
	}

	return nodes;
}

class LocalFixer {
	constructor(offset, lines, style, templateParse) {
		const startIndex = style.startIndex - offset;
		let line = 0;
		let column = startIndex;

		lines.some((lineEndIndex, lineNumber) => {
			if (lineEndIndex >= startIndex) {
				line = lineNumber--;

				if (lineNumber in lines) {
					column = startIndex - lines[lineNumber] - 1;
				}

				return true;
			}
		});

		this.line = line;
		this.column = column;
		this.style = style;
		this.templateParse = templateParse;
	}
	object(object) {
		if (object) {
			if (object.line === 1) {
				object.column += this.column;
			}

			object.line += this.line;
		}
	}
	node(node) {
		this.object(node.source.start);
		this.object(node.source.end);
	}
	root(root) {
		this.node(root);
		root.walk((node) => {
			this.node(node);
		});
	}
	error(error) {
		if (error && error.name === 'CssSyntaxError') {
			this.object(error);
			this.object(error.input);
			error.message = error.message.replace(
				/:\d+:\d+:/,
				':' + error.line + ':' + error.column + ':',
			);
		}

		return error;
	}
	parse(opts) {
		const style = this.style;
		const syntax = style.syntax;
		let root = style.root;

		try {
			root = this.templateParse(
				style.content,
				Object.assign(
					{},
					opts,
					{
						map: false,
					},
					style.opts,
				),
			);
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

function docFixer(offset, source, opts) {
	let match;
	const lines = [];

	reNewLine.lastIndex = 0;
	while ((match = reNewLine.exec(source))) {
		lines.push(match.index);
	}
	lines.push(source.length);

	return function parseStyle(style) {
		const parse = style.syntax ? style.syntax.parse : postcssParse;

		return new LocalFixer(offset, lines, style, parse).parse(opts);
	};
}

function getNodeIndex(node, input) {
	const source = input.css;
	let match;
	let line = 1;
	let lastIndex = -1;

	reNewLine.lastIndex = 0;
	while ((match = reNewLine.exec(source))) {
		if (line === node.source.start.line) {
			return lastIndex + node.source.start.column;
		}

		lastIndex = match.index;
		line++;
	}

	if (line === node.source.start.line) {
		return lastIndex + node.source.start.column;
	}

	return source.length;
}
