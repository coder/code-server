'use strict';

function getTemplate(node, source) {
	return source.slice(node.quasis[0].start, node.quasis[node.quasis.length - 1].end);
}

module.exports = getTemplate;
