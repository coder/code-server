'use strict';

const helper = require('./template-parser-helper');
// eslint-disable-next-line node/no-unpublished-require
const SafeParser = require('postcss-safe-parser/lib/safe-parser');
const templateTokenize = require('./template-tokenize');

class TemplateSafeParser extends SafeParser {
	createTokenizer() {
		this.tokenizer = templateTokenize(this.input, { ignoreErrors: true });
	}
	other() {
		const args = arguments;

		return helper.literal.apply(this, args) || super.other.apply(this, args);
	}
	freeSemicolon() {
		return helper.freeSemicolon.apply(this, arguments);
	}
}
module.exports = TemplateSafeParser;
