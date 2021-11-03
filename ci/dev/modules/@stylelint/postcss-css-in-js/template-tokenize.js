'use strict';

const tokenize = require('postcss/lib/tokenize');

function templateTokenize(input) {
	let pos = input.quasis[0].start;
	const quasis = input.quasis.filter((quasi) => quasi.start !== quasi.end);
	const tokenizer = tokenize.apply(this, arguments);

	function tokenInExpressions(token, returned) {
		const start = pos;

		pos += token[1].length;

		if (
			!quasis.some((quasi) => start >= quasi.start && pos <= quasi.end) ||
			(returned.length && token[0] === returned[0][0])
		) {
			return true;
		} else if (returned.length) {
			back(token);
		}
	}

	function back(token) {
		pos -= token[1].length;

		return tokenizer.back.apply(tokenizer, arguments);
	}

	function nextToken() {
		const args = arguments;
		const returned = [];
		let token;
		let line;
		let column;

		while (
			(token = tokenizer.nextToken.apply(tokenizer, args)) &&
			tokenInExpressions(token, returned)
		) {
			line = token[4] || token[2] || line;
			column = token[5] || token[3] || column;
			returned.push(token);
		}

		if (returned.length) {
			token = [
				returned[0][0],
				returned.map((token) => token[1]).join(''),
				returned[0][2],
				returned[0][3],
				line,
				column,
			];
		}

		return token;
	}

	return Object.assign({}, tokenizer, {
		back,
		nextToken,
	});
}

module.exports = templateTokenize;
