'use strict';

var has = require('has');

var assertRecord = require('../helpers/assertRecord');

var IsDataDescriptor = require('./IsDataDescriptor');
var IsGenericDescriptor = require('./IsGenericDescriptor');
var Type = require('./Type');

// https://ecma-international.org/ecma-262/6.0/#sec-completepropertydescriptor

module.exports = function CompletePropertyDescriptor(Desc) {
	/* eslint no-param-reassign: 0 */
	assertRecord(Type, 'Property Descriptor', 'Desc', Desc);

	if (IsGenericDescriptor(Desc) || IsDataDescriptor(Desc)) {
		if (!has(Desc, '[[Value]]')) {
			Desc['[[Value]]'] = void 0;
		}
		if (!has(Desc, '[[Writable]]')) {
			Desc['[[Writable]]'] = false;
		}
	} else {
		if (!has(Desc, '[[Get]]')) {
			Desc['[[Get]]'] = void 0;
		}
		if (!has(Desc, '[[Set]]')) {
			Desc['[[Set]]'] = void 0;
		}
	}
	if (!has(Desc, '[[Enumerable]]')) {
		Desc['[[Enumerable]]'] = false;
	}
	if (!has(Desc, '[[Configurable]]')) {
		Desc['[[Configurable]]'] = false;
	}
	return Desc;
};
