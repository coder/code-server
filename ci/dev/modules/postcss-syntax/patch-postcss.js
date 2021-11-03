"use strict";
const path = require("path");
const patched = {};

function isPromise (obj) {
	return typeof obj === "object" && typeof obj.then === "function";
}

function runDocument (plugin) {
	const result = this.result;
	result.lastPlugin = plugin;
	const promise = result.root.nodes.map(root => {
		try {
			return plugin(root, result);
		} catch (error) {
			this.handleError(error, plugin);
			throw error;
		}
	});
	if (promise.some(isPromise)) {
		return Promise.all(promise);
	}
}

function patchDocument (Document, LazyResult) {
	LazyResult = LazyResult.prototype;
	const runRoot = LazyResult.run;

	LazyResult.run = function run () {
		return (this.result.root instanceof Document ? runDocument : runRoot).apply(this, arguments);
	};
}

function patchNode (Node) {
	Node = Node.prototype;
	const NodeToString = Node.toString;
	Node.toString = function toString (stringifier) {
		return NodeToString.call(this, stringifier || this.root().source.syntax);
	};
}

function patch (Document) {
	let fn;
	let file;
	if (Document) {
		patch();
		fn = patchDocument.bind(this, Document);
		file = "lazy-result";
	} else {
		fn = patchNode;
		file = "node";
	}
	findPostcss().map(dir => (
		[dir + "lib", file].join(path.sep)
	)).filter(file => (
		!patched[file]
	)).forEach(file => {
		try {
			fn(require(file));
		} catch (ex) {
			//
		}
		patched[file] = true;
	});
}

function findPostcss () {
	const result = {};
	for (const file in require.cache) {
		if (/^(.+?(\\|\/))postcss(\2)/.test(file)) {
			result[RegExp.lastMatch] = true;
		}
	}
	return Object.keys(result);
}

module.exports = patch;
