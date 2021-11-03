'use strict';

const camelCase = require('./camel-case');
const Stringifier = require('postcss/lib/stringifier');

class ObjectStringifier extends Stringifier {
	object(node) {
		this.builder('{', node, 'start');

		let after;

		if (node.nodes && node.nodes.length) {
			this.body(node);
			after = this.raw(node, 'after');
		} else {
			after = this.raw(node, 'after', 'emptyBody');
		}

		if (after) this.builder(after);

		this.builder('}', node, 'end');
	}
	literal(node, semicolon) {
		this.builder(node.text + (semicolon ? ',' : ''), node);
	}
	decl(node, semicolon) {
		let prop = this.rawValue(node, 'prop');

		if (prop === 'float') {
			prop = 'cssFloat';
		}

		let string = prop;

		const isObjectShorthand = node.raws.node && node.raws.node.shorthand;

		if (!isObjectShorthand) {
			const between = this.raw(node, 'between', 'colon');
			const value = this.rawValue(node, 'value');

			string += between + value;
		}

		if (semicolon) string += ',';

		this.builder(string, node);
	}
	rule(node, semicolon) {
		this.block(node, this.rawValue(node, 'selector'), semicolon);
	}
	atrule(node, semicolon) {
		const name = this.rawValue(node, 'name');
		const params = this.rawValue(node, 'params');

		if (node.nodes) {
			let string;

			if (params) {
				const afterName = this.raw(node, 'afterName');

				string = name + afterName + params;
			} else {
				string = name;
			}

			this.block(node, string, semicolon);
		} else {
			const between = this.raw(node, 'between', 'colon');
			let string = name + between + params;

			if (semicolon) string += ',';

			this.builder(string, node);
		}
	}
	block(node, start, semicolon) {
		super.block(node, start);

		if (semicolon) {
			this.builder(',', node);
		}
	}
	comment(node) {
		const left = this.raw(node, 'left', 'commentLeft');
		const right = this.raw(node, 'right', 'commentRight');

		if (node.raws.inline) {
			const text = node.raws.text || node.text;

			this.builder('//' + left + text + right, node);
		} else {
			this.builder('/*' + left + node.text + right + '*/', node);
		}
	}
	raw(node, own, detect) {
		let value = super.raw(node, own, detect);

		if (
			(own === 'between' || (own === 'afterName' && node.type === 'atrule' && !node.nodes)) &&
			!/:/.test(value)
		) {
			value = ':' + value;
		} else if (own === 'before' && /^(decl|rule)$/.test(node.type)) {
			value = value.replace(/\S+$/, '');
		}

		return value;
	}
	rawValue(node, prop) {
		const raw = node.raws[prop];

		if (raw) {
			const descriptor = Object.getOwnPropertyDescriptor(raw, 'raw');

			if (descriptor && descriptor.get) {
				return raw.prefix + raw.raw + raw.suffix;
			}
		}

		let value = super.rawValue(node, prop);

		if (value === null || value === undefined) {
			return value;
		}

		if (/^(prop|selector)$/i.test(prop)) {
			value = camelCase(value);

			if (node.raws.before && /(\S+)$/.test(node.raws.before)) {
				value = RegExp.$1 + value;
			} else if (value && !/\W/.test(value)) {
				return value;
			}
		} else if (node.type === 'atrule') {
			if (prop === 'name') {
				value = '@' + value;
			} else if (node.nodes) {
				return;
			}

			if (node.nodes) {
				value += this.raw(node, 'afterName');
				value += super.rawValue(node, 'params');
			}
		}

		value = JSON.stringify(value);

		return value;
	}
}

module.exports = ObjectStringifier;
