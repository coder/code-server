'use strict';
module.exports = string => string.replace(/^[\r\n]+/, '').replace(/[\r\n]+$/, '');
module.exports.start = string => string.replace(/^[\r\n]+/, '');

module.exports.end = string => {
	let end = string.length;

	while (end > 0 && (string[end - 1] === '\r' || string[end - 1] === '\n')) {
		end--;
	}

	return end < string.length ? string.slice(0, end) : string;
};
