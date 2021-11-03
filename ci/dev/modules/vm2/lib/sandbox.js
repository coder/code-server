/* eslint-disable no-shadow, no-invalid-this */
/* global vm, host, Contextify, Decontextify, VMError, options */

'use strict';

const {Script} = host.require('vm');
const fs = host.require('fs');
const pa = host.require('path');

const BUILTIN_MODULES = host.process.binding('natives');
const parseJSON = JSON.parse;
const importModuleDynamically = () => {
	// We can't throw an error object here because since vm.Script doesn't store a context, we can't properly contextify that error object.
	// eslint-disable-next-line no-throw-literal
	throw 'Dynamic imports are not allowed.';
};

/**
 * @param {Object} host Hosts's internal objects.
 */

return ((vm, host) => {
	'use strict';

	const global = this;

	const TIMERS = new host.WeakMap(); // Contains map of timers created inside sandbox
	const BUILTINS = {__proto__: null};
	const CACHE = {__proto__: null};
	const EXTENSIONS = {
		__proto__: null,
		['.json'](module, filename) {
			try {
				const code = fs.readFileSync(filename, 'utf8');
				module.exports = parseJSON(code);
			} catch (e) {
				throw Contextify.value(e);
			}
		},
		['.node'](module, filename) {
			if (vm.options.require.context === 'sandbox') throw new VMError('Native modules can be required only with context set to \'host\'.');

			try {
				module.exports = Contextify.readonly(host.require(filename));
			} catch (e) {
				throw Contextify.value(e);
			}
		}
	};

	for (let i = 0; i < vm.options.sourceExtensions.length; i++) {
		const ext = vm.options.sourceExtensions[i];

		EXTENSIONS['.' + ext] = (module, filename, dirname) => {
			if (vm.options.require.context !== 'sandbox') {
				try {
					module.exports = Contextify.readonly(host.require(filename));
				} catch (e) {
					throw Contextify.value(e);
				}
			} else {
				let script;

				try {
					// Load module
					let contents = fs.readFileSync(filename, 'utf8');
					contents = vm._compiler(contents, filename);

					const code = `(function (exports, require, module, __filename, __dirname) { 'use strict'; ${contents} \n});`;

					// Precompile script
					script = new Script(code, {
						__proto__: null,
						filename: filename || 'vm.js',
						displayErrors: false,
						importModuleDynamically
					});

				} catch (ex) {
					throw Contextify.value(ex);
				}

				const closure = script.runInContext(global, {
					__proto__: null,
					filename: filename || 'vm.js',
					displayErrors: false,
					importModuleDynamically
				});

				// run the script
				closure(module.exports, module.require, module, filename, dirname);
			}
		};
	}

	const _parseExternalOptions = (options) => {
		if (host.Array.isArray(options)) {
			return {
				__proto__: null,
				external: options,
				transitive: false
			};
		}

		return {
			__proto__: null,
			external: options.modules,
			transitive: options.transitive
		};
	};

	/**
	 * Resolve filename.
	 */

	const _resolveFilename = (path) => {
		if (!path) return null;
		let hasPackageJson;
		try {
			path = pa.resolve(path);

			const exists = fs.existsSync(path);
			const isdir = exists ? fs.statSync(path).isDirectory() : false;

			// direct file match
			if (exists && !isdir) return path;

			// load as file

			for (let i = 0; i < vm.options.sourceExtensions.length; i++) {
				const ext = vm.options.sourceExtensions[i];
				if (fs.existsSync(`${path}.${ext}`)) return `${path}.${ext}`;
			}
			if (fs.existsSync(`${path}.json`)) return `${path}.json`;
			if (fs.existsSync(`${path}.node`)) return `${path}.node`;

			// load as module

			hasPackageJson = fs.existsSync(`${path}/package.json`);
		} catch (e) {
			throw Contextify.value(e);
		}

		if (hasPackageJson) {
			let pkg;
			try {
				pkg = fs.readFileSync(`${path}/package.json`, 'utf8');
			} catch (e) {
				throw Contextify.value(e);
			}
			try {
				pkg = parseJSON(pkg);
			} catch (ex) {
				throw new VMError(`Module '${path}' has invalid package.json`, 'EMODULEINVALID');
			}

			let main;
			if (pkg && pkg.main) {
				main = _resolveFilename(`${path}/${pkg.main}`);
				if (!main) main = _resolveFilename(`${path}/index`);
			} else {
				main = _resolveFilename(`${path}/index`);
			}

			return main;
		}

		// load as directory

		try {
			for (let i = 0; i < vm.options.sourceExtensions.length; i++) {
				const ext = vm.options.sourceExtensions[i];
				if (fs.existsSync(`${path}/index.${ext}`)) return `${path}/index.${ext}`;
			}

			if (fs.existsSync(`${path}/index.json`)) return `${path}/index.json`;
			if (fs.existsSync(`${path}/index.node`)) return `${path}/index.node`;
		} catch (e) {
			throw Contextify.value(e);
		}

		return null;
	};

	/**
	 * Builtin require.
	 */

	const _requireBuiltin = (moduleName) => {
		if (moduleName === 'buffer') return ({Buffer});
		if (BUILTINS[moduleName]) return BUILTINS[moduleName].exports; // Only compiled builtins are stored here

		if (moduleName === 'util') {
			return Contextify.readonly(host.require(moduleName), {
				// Allows VM context to use util.inherits
				__proto__: null,
				inherits: (ctor, superCtor) => {
					ctor.super_ = superCtor;
					Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
				}
			});
		}

		if (moduleName === 'events' || moduleName === 'internal/errors') {
			let script;
			try {
				script = new Script(`(function (exports, require, module, process, internalBinding) {
						'use strict';
						const primordials = global;
						${BUILTIN_MODULES[moduleName]}
						\n
					});`, {
					filename: `${moduleName}.vm.js`
				});

			} catch (e) {
				throw Contextify.value(e);
			}

			// setup module scope
			const module = BUILTINS[moduleName] = {
				exports: {},
				require: _requireBuiltin
			};

			// run script
			try {
				// FIXME binding should be contextified
				script.runInContext(global)(module.exports, module.require, module, host.process, host.process.binding);
			} catch (e) {
				// e could be from inside or outside of sandbox
				throw new VMError(`Error loading '${moduleName}'`);
			}
			return module.exports;
		}

		return Contextify.readonly(host.require(moduleName));
	};

	/**
	 * Prepare require.
	 */

	const _prepareRequire = (currentDirname, parentAllowsTransitive = false) => {
		const _require = moduleName => {
			let requireObj;
			try {
				const optionsObj = vm.options;
				if (optionsObj.nesting && moduleName === 'vm2') return {VM: Contextify.readonly(host.VM), NodeVM: Contextify.readonly(host.NodeVM)};
				requireObj = optionsObj.require;
			} catch (e) {
				throw Contextify.value(e);
			}

			if (!requireObj) throw new VMError(`Access denied to require '${moduleName}'`, 'EDENIED');
			if (moduleName == null) throw new VMError("Module '' not found.", 'ENOTFOUND');
			if (typeof moduleName !== 'string') throw new VMError(`Invalid module name '${moduleName}'`, 'EINVALIDNAME');

			let filename;
			let allowRequireTransitive = false;

			// Mock?

			try {
				const {mock} = requireObj;
				if (mock) {
					const mockModule = mock[moduleName];
					if (mockModule) {
						return Contextify.readonly(mockModule);
					}
				}
			} catch (e) {
				throw Contextify.value(e);
			}

			// Builtin?

			if (BUILTIN_MODULES[moduleName]) {
				let allowed;
				try {
					const builtinObj = requireObj.builtin;
					if (host.Array.isArray(builtinObj)) {
						if (builtinObj.indexOf('*') >= 0) {
							allowed = builtinObj.indexOf(`-${moduleName}`) === -1;
						} else {
							allowed = builtinObj.indexOf(moduleName) >= 0;
						}
					} else if (builtinObj) {
						allowed = builtinObj[moduleName];
					} else {
						allowed = false;
					}
				} catch (e) {
					throw Contextify.value(e);
				}
				if (!allowed) throw new VMError(`Access denied to require '${moduleName}'`, 'EDENIED');

				return _requireBuiltin(moduleName);
			}

			// External?

			let externalObj;
			try {
				externalObj = requireObj.external;
			} catch (e) {
				throw Contextify.value(e);
			}

			if (!externalObj) throw new VMError(`Access denied to require '${moduleName}'`, 'EDENIED');

			if (/^(\.|\.\/|\.\.\/)/.exec(moduleName)) {
				// Module is relative file, e.g. ./script.js or ../script.js

				if (!currentDirname) throw new VMError('You must specify script path to load relative modules.', 'ENOPATH');

				filename = _resolveFilename(`${currentDirname}/${moduleName}`);
			} else if (/^(\/|\\|[a-zA-Z]:\\)/.exec(moduleName)) {
				// Module is absolute file, e.g. /script.js or //server/script.js or C:\script.js

				filename = _resolveFilename(moduleName);
			} else {
				// Check node_modules in path

				if (!currentDirname) throw new VMError('You must specify script path to load relative modules.', 'ENOPATH');

				if (typeof externalObj === 'object') {
					let isWhitelisted;
					try {
						const { external, transitive } = _parseExternalOptions(externalObj);

						isWhitelisted = external.some(ext => host.helpers.match(ext, moduleName)) || (transitive && parentAllowsTransitive);
					} catch (e) {
						throw Contextify.value(e);
					}
					if (!isWhitelisted) {
						throw new VMError(`The module '${moduleName}' is not whitelisted in VM.`, 'EDENIED');
					}

					allowRequireTransitive = true;
				}

				// FIXME the paths array has side effects
				const paths = currentDirname.split(pa.sep);

				while (paths.length) {
					const path = paths.join(pa.sep);

					// console.log moduleName, "#{path}#{pa.sep}node_modules#{pa.sep}#{moduleName}"

					filename = _resolveFilename(`${path}${pa.sep}node_modules${pa.sep}${moduleName}`);
					if (filename) break;

					paths.pop();
				}
			}

			if (!filename) {
				let resolveFunc;
				try {
					resolveFunc = requireObj.resolve;
				} catch (e) {
					throw Contextify.value(e);
				}
				if (resolveFunc) {
					let resolved;
					try {
						resolved = requireObj.resolve(moduleName, currentDirname);
					} catch (e) {
						throw Contextify.value(e);
					}
					filename = _resolveFilename(resolved);
				}
			}
			if (!filename) throw new VMError(`Cannot find module '${moduleName}'`, 'ENOTFOUND');

			// return cache whenever possible
			if (CACHE[filename]) return CACHE[filename].exports;

			const dirname = pa.dirname(filename);
			const extname = pa.extname(filename);

			let allowedModule = true;
			try {
				const rootObj = requireObj.root;
				if (rootObj) {
					const rootPaths = host.Array.isArray(rootObj) ? rootObj : host.Array.of(rootObj);
					allowedModule = rootPaths.some(path => host.String.prototype.startsWith.call(dirname, pa.resolve(path)));
				}
			} catch (e) {
				throw Contextify.value(e);
			}

			if (!allowedModule) {
				throw new VMError(`Module '${moduleName}' is not allowed to be required. The path is outside the border!`, 'EDENIED');
			}

			const module = CACHE[filename] = {
				filename,
				exports: {},
				require: _prepareRequire(dirname, allowRequireTransitive)
			};

			// lookup extensions
			if (EXTENSIONS[extname]) {
				EXTENSIONS[extname](module, filename, dirname);
				return module.exports;
			}

			throw new VMError(`Failed to load '${moduleName}': Unknown type.`, 'ELOADFAIL');
		};

		return _require;
	};

	/**
	 * Prepare sandbox.
	 */

	// This is a function and not an arrow function, since the original is also a function
	global.setTimeout = function setTimeout(callback, delay, ...args) {
		if (typeof callback !== 'function') throw new TypeError('"callback" argument must be a function');
		let tmr;
		try {
			tmr = host.setTimeout(Decontextify.value(() => {
				// FIXME ...args has side effects
				callback(...args);
			}), Decontextify.value(delay));
		} catch (e) {
			throw Contextify.value(e);
		}
		const local = Contextify.value(tmr);

		TIMERS.set(local, tmr);
		return local;
	};

	global.setInterval = function setInterval(callback, interval, ...args) {
		if (typeof callback !== 'function') throw new TypeError('"callback" argument must be a function');
		let tmr;
		try {
			tmr = host.setInterval(Decontextify.value(() => {
				// FIXME ...args has side effects
				callback(...args);
			}), Decontextify.value(interval));
		} catch (e) {
			throw Contextify.value(e);
		}

		const local = Contextify.value(tmr);

		TIMERS.set(local, tmr);
		return local;
	};

	global.setImmediate = function setImmediate(callback, ...args) {
		if (typeof callback !== 'function') throw new TypeError('"callback" argument must be a function');
		let tmr;
		try {
			tmr = host.setImmediate(Decontextify.value(() => {
				// FIXME ...args has side effects
				callback(...args);
			}));
		} catch (e) {
			throw Contextify.value(e);
		}

		const local = Contextify.value(tmr);

		TIMERS.set(local, tmr);
		return local;
	};

	global.clearTimeout = function clearTimeout(local) {
		try {
			host.clearTimeout(TIMERS.get(local));
		} catch (e) {
			throw Contextify.value(e);
		}
	};

	global.clearInterval = function clearInterval(local) {
		try {
			host.clearInterval(TIMERS.get(local));
		} catch (e) {
			throw Contextify.value(e);
		}
	};

	global.clearImmediate = function clearImmediate(local) {
		try {
			host.clearImmediate(TIMERS.get(local));
		} catch (e) {
			throw Contextify.value(e);
		}
	};

	function addListener(name, handler) {
		if (name !== 'beforeExit' && name !== 'exit') {
			throw new Error(`Access denied to listen for '${name}' event.`);
		}

		try {
			host.process.on(name, Decontextify.value(handler));
		} catch (e) {
			throw Contextify.value(e);
		}

		return this;
	}

	const {argv: optionArgv, env: optionsEnv} = options;

	// FIXME wrong class structure
	global.process = {
		argv: optionArgv !== undefined ? Contextify.value(optionArgv) : [],
		title: host.process.title,
		version: host.process.version,
		versions: Contextify.readonly(host.process.versions),
		arch: host.process.arch,
		platform: host.process.platform,
		env: optionsEnv !== undefined ? Contextify.value(optionsEnv) : {},
		pid: host.process.pid,
		features: Contextify.readonly(host.process.features),
		nextTick: function nextTick(callback, ...args) {
			if (typeof callback !== 'function') {
				throw new Error('Callback must be a function.');
			}

			try {
				host.process.nextTick(Decontextify.value(() => {
					// FIXME ...args has side effects
					callback(...args);
				}));
			} catch (e) {
				throw Contextify.value(e);
			}
		},
		hrtime: function hrtime(time) {
			try {
				return Contextify.value(host.process.hrtime(Decontextify.value(time)));
			} catch (e) {
				throw Contextify.value(e);
			}
		},
		cwd: function cwd() {
			try {
				return Contextify.value(host.process.cwd());
			} catch (e) {
				throw Contextify.value(e);
			}
		},
		addListener,
		on: addListener,

		once: function once(name, handler) {
			if (name !== 'beforeExit' && name !== 'exit') {
				throw new Error(`Access denied to listen for '${name}' event.`);
			}

			try {
				host.process.once(name, Decontextify.value(handler));
			} catch (e) {
				throw Contextify.value(e);
			}

			return this;
		},

		listeners: function listeners(name) {
			if (name !== 'beforeExit' && name !== 'exit') {
				// Maybe add ({__proto__:null})[name] to throw when name fails in https://tc39.es/ecma262/#sec-topropertykey.
				return [];
			}

			// Filter out listeners, which were not created in this sandbox
			try {
				return Contextify.value(host.process.listeners(name).filter(listener => Contextify.isVMProxy(listener)));
			} catch (e) {
				throw Contextify.value(e);
			}
		},

		removeListener: function removeListener(name, handler) {
			if (name !== 'beforeExit' && name !== 'exit') {
				return this;
			}

			try {
				host.process.removeListener(name, Decontextify.value(handler));
			} catch (e) {
				throw Contextify.value(e);
			}

			return this;
		},

		umask: function umask() {
			if (arguments.length) {
				throw new Error('Access denied to set umask.');
			}

			try {
				return Contextify.value(host.process.umask());
			} catch (e) {
				throw Contextify.value(e);
			}
		}
	};

	if (vm.options.console === 'inherit') {
		global.console = Contextify.readonly(host.console);
	} else if (vm.options.console === 'redirect') {
		global.console = {
			debug(...args) {
				try {
					// FIXME ...args has side effects
					vm.emit('console.debug', ...Decontextify.arguments(args));
				} catch (e) {
					throw Contextify.value(e);
				}
			},
			log(...args) {
				try {
					// FIXME ...args has side effects
					vm.emit('console.log', ...Decontextify.arguments(args));
				} catch (e) {
					throw Contextify.value(e);
				}
			},
			info(...args) {
				try {
					// FIXME ...args has side effects
					vm.emit('console.info', ...Decontextify.arguments(args));
				} catch (e) {
					throw Contextify.value(e);
				}
			},
			warn(...args) {
				try {
					// FIXME ...args has side effects
					vm.emit('console.warn', ...Decontextify.arguments(args));
				} catch (e) {
					throw Contextify.value(e);
				}
			},
			error(...args) {
				try {
					// FIXME ...args has side effects
					vm.emit('console.error', ...Decontextify.arguments(args));
				} catch (e) {
					throw Contextify.value(e);
				}
			},
			dir(...args) {
				try {
					vm.emit('console.dir', ...Decontextify.arguments(args));
				} catch (e) {
					throw Contextify.value(e);
				}
			},
			time() {},
			timeEnd() {},
			trace(...args) {
				try {
					// FIXME ...args has side effects
					vm.emit('console.trace', ...Decontextify.arguments(args));
				} catch (e) {
					throw Contextify.value(e);
				}
			}
		};
	}

	/*
	Return contextified require.
	*/

	return _prepareRequire;
})(vm, host);
