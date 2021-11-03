'use strict';

// eslint-disable-next-line no-invalid-this, no-shadow
const {GeneratorFunction, AsyncFunction, AsyncGeneratorFunction, global, internal, host, hook} = this;
const {Contextify, Decontextify} = internal;
// eslint-disable-next-line no-shadow
const {Function, eval: eval_, Promise, Object, Reflect} = global;
const {getOwnPropertyDescriptor, defineProperty, assign} = Object;
const {apply: rApply, construct: rConstruct} = Reflect;

const FunctionHandler = {
	__proto__: null,
	apply(target, thiz, args) {
		const type = this.type;
		args = Decontextify.arguments(args);
		try {
			args = Contextify.value(hook(type, args));
		} catch (e) {
			throw Contextify.value(e);
		}
		return rApply(target, thiz, args);
	},
	construct(target, args, newTarget) {
		const type = this.type;
		args = Decontextify.arguments(args);
		try {
			args = Contextify.value(hook(type, args));
		} catch (e) {
			throw Contextify.value(e);
		}
		return rConstruct(target, args, newTarget);
	}
};

function makeCheckFunction(type) {
	return assign({
		__proto__: null,
		type
	}, FunctionHandler);
}

function override(obj, prop, value) {
	const desc = getOwnPropertyDescriptor(obj, prop);
	desc.value = value;
	defineProperty(obj, prop, desc);
}

const proxiedFunction = new host.Proxy(Function, makeCheckFunction('function'));
override(Function.prototype, 'constructor', proxiedFunction);
if (GeneratorFunction) {
	Object.setPrototypeOf(GeneratorFunction, proxiedFunction);
	override(GeneratorFunction.prototype, 'constructor', new host.Proxy(GeneratorFunction, makeCheckFunction('generator_function')));
}
if (AsyncFunction) {
	Object.setPrototypeOf(AsyncFunction, proxiedFunction);
	override(AsyncFunction.prototype, 'constructor', new host.Proxy(AsyncFunction, makeCheckFunction('async_function')));
}
if (AsyncGeneratorFunction) {
	Object.setPrototypeOf(AsyncGeneratorFunction, proxiedFunction);
	override(AsyncGeneratorFunction.prototype, 'constructor', new host.Proxy(AsyncGeneratorFunction, makeCheckFunction('async_generator_function')));
}

global.Function = proxiedFunction;
global.eval = new host.Proxy(eval_, makeCheckFunction('eval'));

if (Promise) {

	Promise.prototype.then = new host.Proxy(Promise.prototype.then, makeCheckFunction('promise_then'));
	Contextify.connect(host.Promise.prototype.then, Promise.prototype.then);

	if (Promise.prototype.finally) {
		Promise.prototype.finally = new host.Proxy(Promise.prototype.finally, makeCheckFunction('promise_finally'));
		Contextify.connect(host.Promise.prototype.finally, Promise.prototype.finally);
	}
	if (Promise.prototype.catch) {
		Promise.prototype.catch = new host.Proxy(Promise.prototype.catch, makeCheckFunction('promise_catch'));
		Contextify.connect(host.Promise.prototype.catch, Promise.prototype.catch);
	}

}
