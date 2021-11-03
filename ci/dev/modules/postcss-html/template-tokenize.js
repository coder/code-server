"use strict";
const tokenize = require("postcss/lib/tokenize");

function templateTokenize () {
	const tokenizer = tokenize.apply(this, arguments);

	function nextToken () {
		const args = arguments;
		const returned = [];
		let token;
		let depth = 0;
		let line;
		let column;

		while ((token = tokenizer.nextToken.apply(tokenizer, args))) {
			if (token[0] !== "word") {
				if (token[0] === "{") {
					++depth;
				} else if (token[0] === "}") {
					--depth;
				}
			}
			if (depth || returned.length) {
				line = token[4] || token[2] || line;
				column = token[5] || token[3] || column;
				returned.push(token);
			}
			if (!depth) {
				break;
			}
		}
		if (returned.length) {
			token = [
				"word",
				returned.map(token => token[1]).join(""),
				returned[0][2],
				returned[0][3],
				line,
				column,
			];
		}
		return token;
	}
	return Object.assign({}, tokenizer, {
		nextToken,
	});
}

module.exports = templateTokenize;
