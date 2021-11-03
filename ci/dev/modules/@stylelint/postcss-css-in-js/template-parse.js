'use strict';

const Input = require('postcss/lib/input');
const TemplateParser = require('./template-parser');

function templateParse(css, opts) {
	const input = new Input(css, opts);

	input.quasis = opts.quasis;
	input.templateLiteralStyles = opts.templateLiteralStyles;
	input.parseOptions = opts;
	const parser = new TemplateParser(input);

	parser.parse();

	return parser.root;
}

module.exports = templateParse;
