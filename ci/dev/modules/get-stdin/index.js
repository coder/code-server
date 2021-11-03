'use strict';
const {stdin} = process;

module.exports = async () => {
	let result = '';

	if (stdin.isTTY) {
		return result;
	}

	stdin.setEncoding('utf8');

	for await (const chunk of stdin) {
		result += chunk;
	}

	return result;
};

module.exports.buffer = async () => {
	const result = [];
	let length = 0;

	if (stdin.isTTY) {
		return Buffer.concat([]);
	}

	for await (const chunk of stdin) {
		result.push(chunk);
		length += chunk.length;
	}

	return Buffer.concat(result, length);
};
