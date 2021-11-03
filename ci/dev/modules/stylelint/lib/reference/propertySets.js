'use strict';

const propertySets = {};

propertySets.acceptCustomIdents = new Set([
	'animation',
	'animation-name',
	'font',
	'font-family',
	'counter-increment',
	'grid-row',
	'grid-column',
	'grid-area',
	'list-style',
	'list-style-type',
]);

module.exports = propertySets;
