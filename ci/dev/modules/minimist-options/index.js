'use strict';

const isPlainObject = require('is-plain-obj');
const arrify = require('arrify');
const kindOf = require('kind-of');

const push = (obj, prop, value) => {
	if (!obj[prop]) {
		obj[prop] = [];
	}

	obj[prop].push(value);
};

const insert = (obj, prop, key, value) => {
	if (!obj[prop]) {
		obj[prop] = {};
	}

	obj[prop][key] = value;
};

const prettyPrint = output => {
	return Array.isArray(output) ?
		`[${output.map(prettyPrint).join(', ')}]` :
		kindOf(output) === 'string' ? JSON.stringify(output) : output;
};

const resolveType = value => {
	if (Array.isArray(value) && value.length > 0) {
		const [element] = value;
		return `${kindOf(element)}-array`;
	}

	return kindOf(value);
};

const normalizeExpectedType = (type, defaultValue) => {
	const inferredType = type === 'array' ? 'string-array' : type;

	if (arrayTypes.includes(inferredType) && Array.isArray(defaultValue) && defaultValue.length === 0) {
		return 'array';
	}

	return inferredType;
};

const passthroughOptions = ['stopEarly', 'unknown', '--'];
const primitiveTypes = ['string', 'boolean', 'number'];
const arrayTypes = primitiveTypes.map(t => `${t}-array`);
const availableTypes = [...primitiveTypes, 'array', ...arrayTypes];

const buildOptions = options => {
	options = options || {};

	const result = {};

	passthroughOptions.forEach(key => {
		if (options[key]) {
			result[key] = options[key];
		}
	});

	Object.keys(options).forEach(key => {
		let value = options[key];

		if (key === 'arguments') {
			key = '_';
		}

		// If short form is used
		// convert it to long form
		// e.g. { 'name': 'string' }
		if (typeof value === 'string') {
			value = {type: value};
		}

		if (isPlainObject(value)) {
			const props = value;
			const {type} = props;

			if (type) {
				if (!availableTypes.includes(type)) {
					throw new TypeError(`Expected type of "${key}" to be one of ${prettyPrint(availableTypes)}, got ${prettyPrint(type)}`);
				}

				if (arrayTypes.includes(type)) {
					const [elementType] = type.split('-');
					push(result, 'array', {key, [elementType]: true});
				} else {
					push(result, type, key);
				}
			}

			if ({}.hasOwnProperty.call(props, 'default')) {
				const {default: defaultValue} = props;
				const defaultType = resolveType(defaultValue);
				const expectedType = normalizeExpectedType(type, defaultValue);

				if (expectedType && expectedType !== defaultType) {
					throw new TypeError(`Expected "${key}" default value to be of type "${expectedType}", got ${prettyPrint(defaultType)}`);
				}

				insert(result, 'default', key, defaultValue);
			}

			arrify(props.alias).forEach(alias => {
				insert(result, 'alias', alias, key);
			});
		}
	});

	return result;
};

module.exports = buildOptions;
module.exports.default = buildOptions;
