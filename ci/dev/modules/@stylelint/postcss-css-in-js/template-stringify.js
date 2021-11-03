'use strict';

const TemplateStringifier = require('./template-stringifier');

module.exports = function TemplateStringify(node, builder) {
	const str = new TemplateStringifier(builder);

	str.stringify(node);
};
