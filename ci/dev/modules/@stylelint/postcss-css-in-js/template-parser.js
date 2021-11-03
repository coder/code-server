'use strict';

const helper = require('./template-parser-helper');
const Parser = require('postcss/lib/parser');
const templateTokenize = require('./template-tokenize');

class TemplateParser extends Parser {
	createTokenizer() {
		this.tokenizer = templateTokenize(this.input);
	}
	other() {
		const args = arguments;

		return helper.literal.apply(this, args) || super.other.apply(this, args);
	}
	freeSemicolon() {
		return helper.freeSemicolon.apply(this, arguments);
	}
}
module.exports = TemplateParser;
