'use strict';

const Container = require('postcss/lib/container');

/**
 * Represents a JS Object Literal
 *
 * @extends Container
 *
 * @example
 * const root = postcss.parse('{}');
 * const obj = root.first;
 * obj.type       //=> 'object'
 * obj.toString() //=> '{}'
 */
class ObjectLiteral extends Container {
	constructor(defaults) {
		super(defaults);
		this.type = 'object';
		this.nodes = [];
	}
}

module.exports = ObjectLiteral;
