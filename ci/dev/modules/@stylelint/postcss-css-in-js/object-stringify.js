'use strict';

const ObjectStringifier = require('./object-stringifier');

module.exports = function objectStringify(node, builder) {
	const str = new ObjectStringifier(builder);

	str.stringify(node);
};
