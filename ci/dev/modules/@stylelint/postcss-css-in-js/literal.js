'use strict';

const Container = require('postcss/lib/container');

/**
 * Represents a JS literal
 *
 * @extends Container
 *
 * @example
 * const root = postcss.parse('{}');
 * const literal = root.first;
 * literal.type       //=> 'literal'
 * literal.toString() //=> 'a{}'
 */
class Literal extends Container {
	constructor(defaults) {
		super(defaults);
		this.type = 'literal';
	}
}

module.exports = Literal;
