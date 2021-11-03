'use strict';

function camelCase(str) {
	return str.replace(/[\w-]+/g, (s) =>
		/^-?[a-z]+(?:-[a-z]+)+$/.test(s)
			? s
					.replace(/^-(ms|moz|khtml|epub|(\w+-?)*webkit)(?=-)/i, '$1')
					.replace(/-\w/g, (s) => s[1].toUpperCase())
			: s,
	);
}

module.exports = camelCase;
