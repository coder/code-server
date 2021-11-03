/* global host */
/* eslint-disable block-spacing, no-multi-spaces, brace-style, no-array-constructor, new-cap, no-use-before-define */

'use strict';

// eslint-disable-next-line no-invalid-this, no-shadow
const global = this;

const local = host.Object.create(null);
local.Object = Object;
local.Array = Array;
local.Reflect = host.Object.create(null);
local.Reflect.ownKeys = Reflect.ownKeys;
local.Reflect.enumerate = Reflect.enumerate;
local.Reflect.getPrototypeOf = Reflect.getPrototypeOf;
local.Reflect.construct = Reflect.construct;
local.Reflect.apply = Reflect.apply;
local.Reflect.set = Reflect.set;
local.Reflect.deleteProperty = Reflect.deleteProperty;
local.Reflect.has = Reflect.has;
local.Reflect.defineProperty = Reflect.defineProperty;
local.Reflect.setPrototypeOf = Reflect.setPrototypeOf;
local.Reflect.isExtensible = Reflect.isExtensible;
local.Reflect.preventExtensions = Reflect.preventExtensions;
local.Reflect.getOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;

// global is originally prototype of host.Object so it can be used to climb up from the sandbox.
Object.setPrototypeOf(global, Object.prototype);

Object.defineProperties(global, {
	global: {value: global},
	GLOBAL: {value: global},
	root: {value: global},
	isVM: {value: true}
});

const DEBUG = false;
const OPNA = 'Operation not allowed on contextified object.';
const captureStackTrace = Error.captureStackTrace;

const FROZEN_TRAPS = host.Object.create(null);
FROZEN_TRAPS.set = (target, key) => false;
FROZEN_TRAPS.setPrototypeOf = (target, key) => false;
FROZEN_TRAPS.defineProperty = (target, key) => false;
FROZEN_TRAPS.deleteProperty = (target, key) => false;
FROZEN_TRAPS.isExtensible = (target, key) => false;
FROZEN_TRAPS.preventExtensions = (target) => false;

// Map of contextified objects to original objects
const Contextified = new host.WeakMap();
const Decontextified = new host.WeakMap();

// We can't use host's hasInstance method
const hasInstance = local.Object[Symbol.hasInstance];
function instanceOf(value, construct) {
	try {
		return host.Reflect.apply(hasInstance, construct, [value]);
	} catch (ex) {
		// Never pass the handled exception through!
		throw new VMError('Unable to perform instanceOf check.');
		// This exception actually never get to the user. It only instructs the caller to return null because we wasn't able to perform instanceOf check.
	}
}

const SHARED_OBJECT = {__proto__: null};

function createBaseObject(obj) {
	let base;
	if (typeof obj === 'function') {
		try {
			// eslint-disable-next-line no-new
			new new host.Proxy(obj, {
				__proto__: null,
				construct() {
					return this;
				}
			})();
			// eslint-disable-next-line func-names
			base = function() {};
			base.prototype = null;
		} catch (e) {
			base = () => {};
		}
	} else if (host.Array.isArray(obj)) {
		base = [];
	} else {
		return {__proto__: null};
	}
	if (!local.Reflect.setPrototypeOf(base, null)) {
		// Should not happen
		return null;
	}
	return base;
}

/**
 * VMError definition.
 */

class VMError extends Error {
	constructor(message, code) {
		super(message);

		this.name = 'VMError';
		this.code = code;

		captureStackTrace(this, this.constructor);
	}
}

global.VMError = VMError;

/*
 * This function will throw a TypeError for accessing properties
 * on a strict mode function
 */
function throwCallerCalleeArgumentsAccess(key) {
	'use strict';
	throwCallerCalleeArgumentsAccess[key];
	return new VMError('Unreachable');
}

function unexpected() {
	throw new VMError('Should not happen');
}

function doPreventExtensions(target, object, doProxy) {
	const keys = local.Reflect.ownKeys(object);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		let desc = local.Reflect.getOwnPropertyDescriptor(object, key);
		if (!desc) continue;
		if (!local.Reflect.setPrototypeOf(desc, null)) unexpected();
		if (!desc.configurable) {
			const current = local.Reflect.getOwnPropertyDescriptor(target, key);
			if (current && !current.configurable) continue;
			if (desc.get || desc.set) {
				desc.get = doProxy(desc.get);
				desc.set = doProxy(desc.set);
			} else {
				desc.value = doProxy(desc.value);
			}
		} else {
			if (desc.get || desc.set) {
				desc = {
					__proto__: null,
					configurable: true,
					enumerable: desc.enumerable,
					writable: true,
					value: null
				};
			} else {
				desc.value = null;
			}
		}
		if (!local.Reflect.defineProperty(target, key, desc)) unexpected();
	}
	if (!local.Reflect.preventExtensions(target)) unexpected();
}

/**
 * Decontextify.
 */

const Decontextify = host.Object.create(null);
Decontextify.proxies = new host.WeakMap();

Decontextify.arguments = args => {
	if (!host.Array.isArray(args)) return new host.Array();

	try {
		const arr = new host.Array();
		for (let i = 0, l = args.length; i < l; i++) arr[i] = Decontextify.value(args[i]);
		return arr;
	} catch (e) {
		// Never pass the handled exception through!
		return new host.Array();
	}
};
Decontextify.instance = (instance, klass, deepTraps, flags, toStringTag) => {
	if (typeof instance === 'function') return Decontextify.function(instance);

	// We must not use normal object because there's a chance object already contains malicious code in the prototype
	const base = host.Object.create(null);

	base.get = (target, key, receiver) => {
		try {
			if (key === 'vmProxyTarget' && DEBUG) return instance;
			if (key === 'isVMProxy') return true;
			if (key === 'constructor') return klass;
			if (key === '__proto__') return klass.prototype;
		} catch (e) {
			// Never pass the handled exception through! This block can't throw an exception under normal conditions.
			return null;
		}

		if (key === '__defineGetter__') return host.Object.prototype.__defineGetter__;
		if (key === '__defineSetter__') return host.Object.prototype.__defineSetter__;
		if (key === '__lookupGetter__') return host.Object.prototype.__lookupGetter__;
		if (key === '__lookupSetter__') return host.Object.prototype.__lookupSetter__;
		if (key === host.Symbol.toStringTag && toStringTag) return toStringTag;

		try {
			return Decontextify.value(instance[key], null, deepTraps, flags);
		} catch (e) {
			throw Decontextify.value(e);
		}
	};
	base.getPrototypeOf = (target) => {
		return klass && klass.prototype;
	};

	return Decontextify.object(instance, base, deepTraps, flags);
};
Decontextify.function = (fnc, traps, deepTraps, flags, mock) => {
	// We must not use normal object because there's a chance object already contains malicious code in the prototype
	const base = host.Object.create(null);
	// eslint-disable-next-line prefer-const
	let proxy;

	base.apply = (target, context, args) => {
		context = Contextify.value(context);

		// Set context of all arguments to vm's context.
		args = Contextify.arguments(args);

		try {
			return Decontextify.value(fnc.apply(context, args));
		} catch (e) {
			throw Decontextify.value(e);
		}
	};
	base.construct = (target, args, newTarget) => {
		args = Contextify.arguments(args);

		try {
			return Decontextify.instance(new fnc(...args), proxy, deepTraps, flags);
		} catch (e) {
			throw Decontextify.value(e);
		}
	};
	base.get = (target, key, receiver) => {
		try {
			if (key === 'vmProxyTarget' && DEBUG) return fnc;
			if (key === 'isVMProxy') return true;
			if (mock && host.Object.prototype.hasOwnProperty.call(mock, key)) return mock[key];
			if (key === 'constructor') return host.Function;
			if (key === '__proto__') return host.Function.prototype;
		} catch (e) {
			// Never pass the handled exception through! This block can't throw an exception under normal conditions.
			return null;
		}

		if (key === '__defineGetter__') return host.Object.prototype.__defineGetter__;
		if (key === '__defineSetter__') return host.Object.prototype.__defineSetter__;
		if (key === '__lookupGetter__') return host.Object.prototype.__lookupGetter__;
		if (key === '__lookupSetter__') return host.Object.prototype.__lookupSetter__;

		try {
			return Decontextify.value(fnc[key], null, deepTraps, flags);
		} catch (e) {
			throw Decontextify.value(e);
		}
	};
	base.getPrototypeOf = (target) => {
		return host.Function.prototype;
	};

	proxy = Decontextify.object(fnc, host.Object.assign(base, traps), deepTraps);
	return proxy;
};
Decontextify.object = (object, traps, deepTraps, flags, mock) => {
	// We must not use normal object because there's a chance object already contains malicious code in the prototype
	const base = host.Object.create(null);

	base.get = (target, key, receiver) => {
		try {
			if (key === 'vmProxyTarget' && DEBUG) return object;
			if (key === 'isVMProxy') return true;
			if (mock && host.Object.prototype.hasOwnProperty.call(mock, key)) return mock[key];
			if (key === 'constructor') return host.Object;
			if (key === '__proto__') return host.Object.prototype;
		} catch (e) {
			// Never pass the handled exception through! This block can't throw an exception under normal conditions.
			return null;
		}

		if (key === '__defineGetter__') return host.Object.prototype.__defineGetter__;
		if (key === '__defineSetter__') return host.Object.prototype.__defineSetter__;
		if (key === '__lookupGetter__') return host.Object.prototype.__lookupGetter__;
		if (key === '__lookupSetter__') return host.Object.prototype.__lookupSetter__;

		try {
			return Decontextify.value(object[key], null, deepTraps, flags);
		} catch (e) {
			throw Decontextify.value(e);
		}
	};
	base.set = (target, key, value, receiver) => {
		value = Contextify.value(value);

		try {
			return local.Reflect.set(object, key, value);
		} catch (e) {
			throw Decontextify.value(e);
		}
	};
	base.getOwnPropertyDescriptor = (target, prop) => {
		let def;

		try {
			def = host.Object.getOwnPropertyDescriptor(object, prop);
		} catch (e) {
			throw Decontextify.value(e);
		}

		// Following code prevents V8 to throw
		// TypeError: 'getOwnPropertyDescriptor' on proxy: trap reported non-configurability for property '<prop>'
		// which is either non-existant or configurable in the proxy target

		let desc;
		if (!def) {
			return undefined;
		} else if (def.get || def.set) {
			desc = {
				__proto__: null,
				get: Decontextify.value(def.get) || undefined,
				set: Decontextify.value(def.set) || undefined,
				enumerable: def.enumerable === true,
				configurable: def.configurable === true
			};
		} else {
			desc = {
				__proto__: null,
				value: Decontextify.value(def.value),
				writable: def.writable === true,
				enumerable: def.enumerable === true,
				configurable: def.configurable === true
			};
		}
		if (!desc.configurable) {
			try {
				def = host.Object.getOwnPropertyDescriptor(target, prop);
				if (!def || def.configurable || def.writable !== desc.writable) {
					local.Reflect.defineProperty(target, prop, desc);
				}
			} catch (e) {
				// Should not happen.
			}
		}
		return desc;
	};
	base.defineProperty = (target, key, descriptor) => {
		let success = false;
		try {
			success = local.Reflect.setPrototypeOf(descriptor, null);
		} catch (e) {
			// Should not happen
		}
		if (!success) return false;
		// There's a chance accessing a property throws an error so we must not access them
		// in try catch to prevent contextifying local objects.

		const propertyDescriptor = host.Object.create(null);
		if (descriptor.get || descriptor.set) {
			propertyDescriptor.get = Contextify.value(descriptor.get, null, deepTraps, flags) || undefined;
			propertyDescriptor.set = Contextify.value(descriptor.set, null, deepTraps, flags) || undefined;
			propertyDescriptor.enumerable = descriptor.enumerable === true;
			propertyDescriptor.configurable = descriptor.configurable === true;
		} else {
			propertyDescriptor.value = Contextify.value(descriptor.value, null, deepTraps, flags);
			propertyDescriptor.writable = descriptor.writable === true;
			propertyDescriptor.enumerable = descriptor.enumerable === true;
			propertyDescriptor.configurable = descriptor.configurable === true;
		}

		try {
			success = local.Reflect.defineProperty(object, key, propertyDescriptor);
		} catch (e) {
			throw Decontextify.value(e);
		}
		if (success && !descriptor.configurable) {
			try {
				local.Reflect.defineProperty(target, key, descriptor);
			} catch (e) {
				// This should not happen.
				return false;
			}
		}
		return success;
	};
	base.deleteProperty = (target, prop) => {
		try {
			return Decontextify.value(local.Reflect.deleteProperty(object, prop));
		} catch (e) {
			throw Decontextify.value(e);
		}
	};
	base.getPrototypeOf = (target) => {
		return host.Object.prototype;
	};
	base.setPrototypeOf = (target) => {
		throw new host.Error(OPNA);
	};
	base.has = (target, key) => {
		try {
			return Decontextify.value(local.Reflect.has(object, key));
		} catch (e) {
			throw Decontextify.value(e);
		}
	};
	base.isExtensible = target => {
		let result;
		try {
			result = local.Reflect.isExtensible(object);
		} catch (e) {
			throw Decontextify.value(e);
		}
		if (!result) {
			try {
				if (local.Reflect.isExtensible(target)) {
					doPreventExtensions(target, object, obj => Contextify.value(obj, null, deepTraps, flags));
				}
			} catch (e) {
				// Should not happen
			}
		}
		return result;
	};
	base.ownKeys = target => {
		try {
			return Decontextify.value(local.Reflect.ownKeys(object));
		} catch (e) {
			throw Decontextify.value(e);
		}
	};
	base.preventExtensions = target => {
		let success;
		try {
			success = local.Reflect.preventExtensions(object);
		} catch (e) {
			throw Decontextify.value(e);
		}
		if (success) {
			try {
				if (local.Reflect.isExtensible(target)) {
					doPreventExtensions(target, object, obj => Contextify.value(obj, null, deepTraps, flags));
				}
			} catch (e) {
				// Should not happen
			}
		}
		return success;
	};
	base.enumerate = target => {
		try {
			return Decontextify.value(local.Reflect.enumerate(object));
		} catch (e) {
			throw Decontextify.value(e);
		}
	};

	host.Object.assign(base, traps, deepTraps);

	let shallow;
	if (host.Array.isArray(object)) {
		const origGet = base.get;
		shallow = {
			__proto__: null,
			ownKeys: base.ownKeys,
			// TODO this get will call getOwnPropertyDescriptor of target all the time.
			get: origGet
		};
		base.ownKeys = target => {
			try {
				const keys = local.Reflect.ownKeys(object);
				// Do this hack so that console.log(decontextify([1,2,3])) doesn't write the properties twice
				// a la [1,2,3,'0':1,'1':2,'2':3]
				return Decontextify.value(keys.filter(key=>typeof key!=='string' || !key.match(/^\d+$/)));
			} catch (e) {
				throw Decontextify.value(e);
			}
		};
		base.get = (target, key, receiver) => {
			if (key === host.Symbol.toStringTag) return;
			return origGet(target, key, receiver);
		};
	} else {
		shallow = SHARED_OBJECT;
	}

	const proxy = new host.Proxy(createBaseObject(object), base);
	Decontextified.set(proxy, object);
	// We need two proxies since nodes inspect just removes one.
	const proxy2 = new host.Proxy(proxy, shallow);
	Decontextify.proxies.set(object, proxy2);
	Decontextified.set(proxy2, object);
	return proxy2;
};
Decontextify.value = (value, traps, deepTraps, flags, mock) => {
	try {
		if (Contextified.has(value)) {
			// Contextified object has returned back from vm
			return Contextified.get(value);
		} else if (Decontextify.proxies.has(value)) {
			// Decontextified proxy already exists, reuse
			return Decontextify.proxies.get(value);
		}

		switch (typeof value) {
			case 'object':
				if (value === null) {
					return null;
				} else if (instanceOf(value, Number))         { return Decontextify.instance(value, host.Number, deepTraps, flags, 'Number');
				} else if (instanceOf(value, String))         { return Decontextify.instance(value, host.String, deepTraps, flags, 'String');
				} else if (instanceOf(value, Boolean))        { return Decontextify.instance(value, host.Boolean, deepTraps, flags, 'Boolean');
				} else if (instanceOf(value, Date))           { return Decontextify.instance(value, host.Date, deepTraps, flags, 'Date');
				} else if (instanceOf(value, RangeError))     { return Decontextify.instance(value, host.RangeError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, ReferenceError)) { return Decontextify.instance(value, host.ReferenceError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, SyntaxError))    { return Decontextify.instance(value, host.SyntaxError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, TypeError))      { return Decontextify.instance(value, host.TypeError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, VMError))        { return Decontextify.instance(value, host.VMError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, EvalError))      { return Decontextify.instance(value, host.EvalError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, URIError))       { return Decontextify.instance(value, host.URIError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, Error))          { return Decontextify.instance(value, host.Error, deepTraps, flags, 'Error');
				} else if (instanceOf(value, Array))          { return Decontextify.instance(value, host.Array, deepTraps, flags, 'Array');
				} else if (instanceOf(value, RegExp))         { return Decontextify.instance(value, host.RegExp, deepTraps, flags, 'RegExp');
				} else if (instanceOf(value, Map))            { return Decontextify.instance(value, host.Map, deepTraps, flags, 'Map');
				} else if (instanceOf(value, WeakMap))        { return Decontextify.instance(value, host.WeakMap, deepTraps, flags, 'WeakMap');
				} else if (instanceOf(value, Set))            { return Decontextify.instance(value, host.Set, deepTraps, flags, 'Set');
				} else if (instanceOf(value, WeakSet))        { return Decontextify.instance(value, host.WeakSet, deepTraps, flags, 'WeakSet');
				} else if (typeof Promise === 'function' && instanceOf(value, Promise)) {
					return Decontextify.instance(value, host.Promise, deepTraps, flags, 'Promise');
				} else if (local.Reflect.getPrototypeOf(value) === null) {
					return Decontextify.instance(value, null, deepTraps, flags);
				} else {
					return Decontextify.object(value, traps, deepTraps, flags, mock);
				}
			case 'function':
				return Decontextify.function(value, traps, deepTraps, flags, mock);

			case 'undefined':
				return undefined;

			default: // string, number, boolean, symbol
				return value;
		}
	} catch (ex) {
		// Never pass the handled exception through! This block can't throw an exception under normal conditions.
		return null;
	}
};

/**
 * Contextify.
 */

const Contextify = host.Object.create(null);
Contextify.proxies = new host.WeakMap();

Contextify.arguments = args => {
	if (!host.Array.isArray(args)) return new local.Array();

	try {
		const arr = new local.Array();
		for (let i = 0, l = args.length; i < l; i++) arr[i] = Contextify.value(args[i]);
		return arr;
	} catch (e) {
		// Never pass the handled exception through!
		return new local.Array();
	}
};
Contextify.instance = (instance, klass, deepTraps, flags, toStringTag) => {
	if (typeof instance === 'function') return Contextify.function(instance);

	// We must not use normal object because there's a chance object already contains malicious code in the prototype
	const base = host.Object.create(null);

	base.get = (target, key, receiver) => {
		try {
			if (key === 'vmProxyTarget' && DEBUG) return instance;
			if (key === 'isVMProxy') return true;
			if (key === 'constructor') return klass;
			if (key === '__proto__') return klass.prototype;
		} catch (e) {
			// Never pass the handled exception through! This block can't throw an exception under normal conditions.
			return null;
		}

		if (key === '__defineGetter__') return local.Object.prototype.__defineGetter__;
		if (key === '__defineSetter__') return local.Object.prototype.__defineSetter__;
		if (key === '__lookupGetter__') return local.Object.prototype.__lookupGetter__;
		if (key === '__lookupSetter__') return local.Object.prototype.__lookupSetter__;
		if (key === host.Symbol.toStringTag && toStringTag) return toStringTag;

		try {
			return Contextify.value(host.Reflect.get(instance, key), null, deepTraps, flags);
		} catch (e) {
			throw Contextify.value(e);
		}
	};
	base.getPrototypeOf = (target) => {
		return klass && klass.prototype;
	};

	return Contextify.object(instance, base, deepTraps, flags);
};
Contextify.function = (fnc, traps, deepTraps, flags, mock) => {
	// We must not use normal object because there's a chance object already contains malicious code in the prototype
	const base = host.Object.create(null);
	// eslint-disable-next-line prefer-const
	let proxy;

	base.apply = (target, context, args) => {
		context = Decontextify.value(context);

		// Set context of all arguments to host's context.
		args = Decontextify.arguments(args);

		try {
			return Contextify.value(fnc.apply(context, args));
		} catch (e) {
			throw Contextify.value(e);
		}
	};
	base.construct = (target, args, newTarget) => {
		// Fixes buffer unsafe allocation for node v6/7
		if (host.version < 8 && fnc === host.Buffer && 'number' === typeof args[0]) {
			args[0] = new Array(args[0]).fill(0);
		}

		args = Decontextify.arguments(args);

		try {
			return Contextify.instance(new fnc(...args), proxy, deepTraps, flags);
		} catch (e) {
			throw Contextify.value(e);
		}
	};
	base.get = (target, key, receiver) => {
		try {
			if (key === 'vmProxyTarget' && DEBUG) return fnc;
			if (key === 'isVMProxy') return true;
			if (mock && host.Object.prototype.hasOwnProperty.call(mock, key)) return mock[key];
			if (key === 'constructor') return Function;
			if (key === '__proto__') return Function.prototype;
		} catch (e) {
			// Never pass the handled exception through! This block can't throw an exception under normal conditions.
			return null;
		}

		if (key === '__defineGetter__') return local.Object.prototype.__defineGetter__;
		if (key === '__defineSetter__') return local.Object.prototype.__defineSetter__;
		if (key === '__lookupGetter__') return local.Object.prototype.__lookupGetter__;
		if (key === '__lookupSetter__') return local.Object.prototype.__lookupSetter__;

		if (key === 'caller' || key === 'callee' || key === 'arguments') throw throwCallerCalleeArgumentsAccess(key);

		try {
			return Contextify.value(host.Reflect.get(fnc, key), null, deepTraps, flags);
		} catch (e) {
			throw Contextify.value(e);
		}
	};
	base.getPrototypeOf = (target) => {
		return Function.prototype;
	};

	proxy = Contextify.object(fnc, host.Object.assign(base, traps), deepTraps);
	return proxy;
};
Contextify.object = (object, traps, deepTraps, flags, mock) => {
	// We must not use normal object because there's a chance object already contains malicious code in the prototype
	const base = host.Object.create(null);

	base.get = (target, key, receiver) => {
		try {
			if (key === 'vmProxyTarget' && DEBUG) return object;
			if (key === 'isVMProxy') return true;
			if (mock && host.Object.prototype.hasOwnProperty.call(mock, key)) return mock[key];
			if (key === 'constructor') return Object;
			if (key === '__proto__') return Object.prototype;
		} catch (e) {
			// Never pass the handled exception through! This block can't throw an exception under normal conditions.
			return null;
		}

		if (key === '__defineGetter__') return local.Object.prototype.__defineGetter__;
		if (key === '__defineSetter__') return local.Object.prototype.__defineSetter__;
		if (key === '__lookupGetter__') return local.Object.prototype.__lookupGetter__;
		if (key === '__lookupSetter__') return local.Object.prototype.__lookupSetter__;

		try {
			return Contextify.value(host.Reflect.get(object, key), null, deepTraps, flags);
		} catch (e) {
			throw Contextify.value(e);
		}
	};
	base.set = (target, key, value, receiver) => {
		if (key === '__proto__') return false;
		if (flags && flags.protected && typeof value === 'function') return false;

		value = Decontextify.value(value);

		try {
			return host.Reflect.set(object, key, value);
		} catch (e) {
			throw Contextify.value(e);
		}
	};
	base.getOwnPropertyDescriptor = (target, prop) => {
		let def;

		try {
			def = host.Object.getOwnPropertyDescriptor(object, prop);
		} catch (e) {
			throw Contextify.value(e);
		}

		// Following code prevents V8 to throw
		// TypeError: 'getOwnPropertyDescriptor' on proxy: trap reported non-configurability for property '<prop>'
		// which is either non-existant or configurable in the proxy target

		let desc;
		if (!def) {
			return undefined;
		} else if (def.get || def.set) {
			desc = {
				__proto__: null,
				get: Contextify.value(def.get, null, deepTraps, flags) || undefined,
				set: Contextify.value(def.set, null, deepTraps, flags) || undefined,
				enumerable: def.enumerable === true,
				configurable: def.configurable === true
			};
		} else {
			desc = {
				__proto__: null,
				value: Contextify.value(def.value, null, deepTraps, flags),
				writable: def.writable === true,
				enumerable: def.enumerable === true,
				configurable: def.configurable === true
			};
		}
		if (!desc.configurable) {
			try {
				def = host.Object.getOwnPropertyDescriptor(target, prop);
				if (!def || def.configurable || def.writable !== desc.writable) {
					local.Reflect.defineProperty(target, prop, desc);
				}
			} catch (e) {
				// Should not happen.
			}
		}
		return desc;
	};
	base.defineProperty = (target, key, descriptor) => {
		let success = false;
		try {
			success = local.Reflect.setPrototypeOf(descriptor, null);
		} catch (e) {
			// Should not happen
		}
		if (!success) return false;
		// There's a chance accessing a property throws an error so we must not access them
		// in try catch to prevent contextifying local objects.

		const descGet = descriptor.get;
		const descSet = descriptor.set;
		const descValue = descriptor.value;

		if (flags && flags.protected) {
			if (descGet || descSet || typeof descValue === 'function') return false;
		}

		const propertyDescriptor = host.Object.create(null);
		if (descGet || descSet) {
			propertyDescriptor.get = Decontextify.value(descGet, null, deepTraps, flags) || undefined;
			propertyDescriptor.set = Decontextify.value(descSet, null, deepTraps, flags) || undefined;
			propertyDescriptor.enumerable = descriptor.enumerable === true;
			propertyDescriptor.configurable = descriptor.configurable === true;
		} else {
			propertyDescriptor.value = Decontextify.value(descValue, null, deepTraps, flags);
			propertyDescriptor.writable = descriptor.writable === true;
			propertyDescriptor.enumerable = descriptor.enumerable === true;
			propertyDescriptor.configurable = descriptor.configurable === true;
		}

		try {
			success = host.Reflect.defineProperty(object, key, propertyDescriptor);
		} catch (e) {
			throw Contextify.value(e);
		}
		if (success && !descriptor.configurable) {
			try {
				local.Reflect.defineProperty(target, key, descriptor);
			} catch (e) {
				// This should not happen.
				return false;
			}
		}
		return success;
	};
	base.deleteProperty = (target, prop) => {
		try {
			return Contextify.value(host.Reflect.deleteProperty(object, prop));
		} catch (e) {
			throw Contextify.value(e);
		}
	};
	base.getPrototypeOf = (target) => {
		return local.Object.prototype;
	};
	base.setPrototypeOf = (target) => {
		throw new VMError(OPNA);
	};
	base.has = (target, key) => {
		try {
			return Contextify.value(host.Reflect.has(object, key));
		} catch (e) {
			throw Contextify.value(e);
		}
	};
	base.isExtensible = target => {
		let result;
		try {
			result = host.Reflect.isExtensible(object);
		} catch (e) {
			throw Contextify.value(e);
		}
		if (!result) {
			try {
				if (local.Reflect.isExtensible(target)) {
					doPreventExtensions(target, object, obj => Decontextify.value(obj, null, deepTraps, flags));
				}
			} catch (e) {
				// Should not happen
			}
		}
		return result;
	};
	base.ownKeys = target => {
		try {
			return Contextify.value(host.Reflect.ownKeys(object));
		} catch (e) {
			throw Contextify.value(e);
		}
	};
	base.preventExtensions = target => {
		let success;
		try {
			success = local.Reflect.preventExtensions(object);
		} catch (e) {
			throw Contextify.value(e);
		}
		if (success) {
			try {
				if (local.Reflect.isExtensible(target)) {
					doPreventExtensions(target, object, obj => Decontextify.value(obj, null, deepTraps, flags));
				}
			} catch (e) {
				// Should not happen
			}
		}
		return success;
	};
	base.enumerate = target => {
		try {
			return Contextify.value(host.Reflect.enumerate(object));
		} catch (e) {
			throw Contextify.value(e);
		}
	};

	const proxy = new host.Proxy(createBaseObject(object), host.Object.assign(base, traps, deepTraps));
	Contextify.proxies.set(object, proxy);
	Contextified.set(proxy, object);
	return proxy;
};
Contextify.value = (value, traps, deepTraps, flags, mock) => {
	try {
		if (Decontextified.has(value)) {
			// Decontextified object has returned back to vm
			return Decontextified.get(value);
		} else if (Contextify.proxies.has(value)) {
			// Contextified proxy already exists, reuse
			return Contextify.proxies.get(value);
		}

		switch (typeof value) {
			case 'object':
				if (value === null) {
					return null;
				} else if (instanceOf(value, host.Number))         { return Contextify.instance(value, Number, deepTraps, flags, 'Number');
				} else if (instanceOf(value, host.String))         { return Contextify.instance(value, String, deepTraps, flags, 'String');
				} else if (instanceOf(value, host.Boolean))        { return Contextify.instance(value, Boolean, deepTraps, flags, 'Boolean');
				} else if (instanceOf(value, host.Date))           { return Contextify.instance(value, Date, deepTraps, flags, 'Date');
				} else if (instanceOf(value, host.RangeError))     { return Contextify.instance(value, RangeError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, host.ReferenceError)) { return Contextify.instance(value, ReferenceError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, host.SyntaxError))    { return Contextify.instance(value, SyntaxError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, host.TypeError))      { return Contextify.instance(value, TypeError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, host.VMError))        { return Contextify.instance(value, VMError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, host.EvalError))      { return Contextify.instance(value, EvalError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, host.URIError))       { return Contextify.instance(value, URIError, deepTraps, flags, 'Error');
				} else if (instanceOf(value, host.Error))          { return Contextify.instance(value, Error, deepTraps, flags, 'Error');
				} else if (instanceOf(value, host.Array))          { return Contextify.instance(value, Array, deepTraps, flags, 'Array');
				} else if (instanceOf(value, host.RegExp))         { return Contextify.instance(value, RegExp, deepTraps, flags, 'RegExp');
				} else if (instanceOf(value, host.Map))            { return Contextify.instance(value, Map, deepTraps, flags, 'Map');
				} else if (instanceOf(value, host.WeakMap))        { return Contextify.instance(value, WeakMap, deepTraps, flags, 'WeakMap');
				} else if (instanceOf(value, host.Set))            { return Contextify.instance(value, Set, deepTraps, flags, 'Set');
				} else if (instanceOf(value, host.WeakSet))        { return Contextify.instance(value, WeakSet, deepTraps, flags, 'WeakSet');
				} else if (typeof Promise === 'function' && instanceOf(value, host.Promise)) {
					return Contextify.instance(value, Promise, deepTraps, flags, 'Promise');
				} else if (instanceOf(value, host.Buffer))         { return Contextify.instance(value, LocalBuffer, deepTraps, flags, 'Uint8Array');
				} else if (host.Reflect.getPrototypeOf(value) === null) {
					return Contextify.instance(value, null, deepTraps, flags);
				} else {
					return Contextify.object(value, traps, deepTraps, flags, mock);
				}
			case 'function':
				return Contextify.function(value, traps, deepTraps, flags, mock);

			case 'undefined':
				return undefined;

			default: // string, number, boolean, symbol
				return value;
		}
	} catch (ex) {
		// Never pass the handled exception through! This block can't throw an exception under normal conditions.
		return null;
	}
};
Contextify.setGlobal = (name, value) => {
	const prop = Contextify.value(name);
	try {
		global[prop] = Contextify.value(value);
	} catch (e) {
		throw Decontextify.value(e);
	}
};
Contextify.getGlobal = (name) => {
	const prop = Contextify.value(name);
	try {
		return Decontextify.value(global[prop]);
	} catch (e) {
		throw Decontextify.value(e);
	}
};
Contextify.readonly = (value, mock) => {
	return Contextify.value(value, null, FROZEN_TRAPS, null, mock);
};
Contextify.protected = (value, mock) => {
	return Contextify.value(value, null, null, {protected: true}, mock);
};
Contextify.connect = (outer, inner) => {
	Decontextified.set(outer, inner);
	Contextified.set(inner, outer);
};
Contextify.makeModule = ()=>({exports: {}});
Contextify.isVMProxy = (obj) => Decontextified.has(obj);

const BufferMock = host.Object.create(null);
BufferMock.allocUnsafe = function allocUnsafe(size) {
	return this.alloc(size);
};
BufferMock.allocUnsafeSlow = function allocUnsafeSlow(size) {
	return this.alloc(size);
};
const BufferOverride = host.Object.create(null);
BufferOverride.inspect = function inspect(recurseTimes, ctx) {
	// Mimic old behavior, could throw but didn't pass a test.
	const max = host.INSPECT_MAX_BYTES;
	const actualMax = Math.min(max, this.length);
	const remaining = this.length - max;
	let str = this.hexSlice(0, actualMax).replace(/(.{2})/g, '$1 ').trim();
	if (remaining > 0) str += ` ... ${remaining} more byte${remaining > 1 ? 's' : ''}`;
	return `<${this.constructor.name} ${str}>`;
};
const LocalBuffer = global.Buffer = Contextify.readonly(host.Buffer, BufferMock);
Contextify.connect(host.Buffer.prototype.inspect, BufferOverride.inspect);


const exportsMap = host.Object.create(null);
exportsMap.Contextify = Contextify;
exportsMap.Decontextify = Decontextify;
exportsMap.Buffer = LocalBuffer;
exportsMap.sandbox = Decontextify.value(global);
exportsMap.Function = Function;

return exportsMap;
