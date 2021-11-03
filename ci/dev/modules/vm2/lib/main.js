/* eslint-disable global-require, no-use-before-define */

'use strict';

/**
 * This callback will be called to transform a script to JavaScript.
 *
 * @callback compileCallback
 * @param {string} code - Script code to transform to JavaScript.
 * @param {string} filename - Filename of this script.
 * @return {string} JavaScript code that represents the script code.
 */

/**
 * This callback will be called to resolve a module if it couldn't be found.
 *
 * @callback resolveCallback
 * @param {string} moduleName - Name of the module to resolve.
 * @param {string} dirname - Name of the current directory.
 * @return {(string|undefined)} The file or directory to use to load the requested module.
 */

const fs = require('fs');
const vm = require('vm');
const pa = require('path');
const {EventEmitter} = require('events');
const {INSPECT_MAX_BYTES} = require('buffer');
const helpers = require('./helpers.js');
const importModuleDynamically = () => {
	// We can't throw an error object here because since vm.Script doesn't store a context, we can't properly contextify that error object.
	// eslint-disable-next-line no-throw-literal
	throw 'Dynamic imports are not allowed.';
};

/**
 * Load a script from a file and compile it.
 * 
 * @private
 * @param {string} filename - File to load and compile to a script.
 * @param {string} prefix - Prefix for the script.
 * @param {string} suffix - Suffix for the script.
 * @return {vm.Script} The compiled script.
 */
function loadAndCompileScript(filename, prefix, suffix) {
	const data = fs.readFileSync(filename, 'utf8');
	return new vm.Script(prefix + data + suffix, {
		filename,
		displayErrors: false,
		importModuleDynamically
	});
}

/**
 * Cache where we can cache some things
 * 
 * @private
 * @property {?compileCallback} coffeeScriptCompiler - The coffee script compiler or null if not yet used.
 * @property {?Object} timeoutContext - The context used for the timeout functionality of null if not yet used.
 * @property {?vm.Script} timeoutScript - The compiled script used for the timeout functionality of null if not yet used.
 * @property {vm.Script} contextifyScript - The compiled script used to setup a sandbox.
 * @property {?vm.Script} sandboxScript - The compiled script used to setup the NodeVM require mechanism of null if not yet used.
 * @property {?vm.Script} hookScript - The compiled script used to setup the async hooking functionality.
 * @property {?vm.Script} getGlobalScript - The compiled script used to get the global sandbox object.
 * @property {?vm.Script} getGeneratorFunctionScript - The compiled script used to get the generator function constructor.
 * @property {?vm.Script} getAsyncFunctionScript - The compiled script used to get the async function constructor.
 * @property {?vm.Script} getAsyncGeneratorFunctionScript - The compiled script used to get the async generator function constructor.
 */
const CACHE = {
	coffeeScriptCompiler: null,
	timeoutContext: null,
	timeoutScript: null,
	contextifyScript: loadAndCompileScript(`${__dirname}/contextify.js`, '(function(require, host) { ', '\n})'),
	sandboxScript: null,
	hookScript: null,
	getGlobalScript: null,
	getGeneratorFunctionScript: null,
	getAsyncFunctionScript: null,
	getAsyncGeneratorFunctionScript: null,
};

/**
 * Default run options for vm.Script.runInContext
 * 
 * @private
 */
const DEFAULT_RUN_OPTIONS = {displayErrors: false, importModuleDynamically};

/**
 * Returns the cached coffee script compiler or loads it
 * if it is not found in the cache.
 * 
 * @private
 * @return {compileCallback} The coffee script compiler.
 * @throws {VMError} If the coffee-script module can't be found.
 */
function getCoffeeScriptCompiler() {
	if (!CACHE.coffeeScriptCompiler) {
		try {
			const coffeeScript = require('coffee-script');
			CACHE.coffeeScriptCompiler = (code, filename) => {
				return coffeeScript.compile(code, {header: false, bare: true});
			};
		} catch (e) {
			throw new VMError('Coffee-Script compiler is not installed.');
		}
	}
	return CACHE.coffeeScriptCompiler;
}

/**
 * The JavaScript compiler, just a identity function.
 * 
 * @private
 * @type {compileCallback}
 * @param {string} code - The JavaScript code.
 * @param {string} filename - Filename of this script.
 * @return {string} The code.
 */
function jsCompiler(code, filename) {
	return removeShebang(code);
}

/**
 * Look up the compiler for a specific name.
 * 
 * @private
 * @param {(string|compileCallback)} compiler - A compile callback or the name of the compiler.
 * @return {compileCallback} The resolved compiler.
 * @throws {VMError} If the compiler is unknown or the coffee script module was needed and couldn't be found.
 */
function lookupCompiler(compiler) {
	if ('function' === typeof compiler) return compiler;
	switch (compiler) {
		case 'coffeescript':
		case 'coffee-script':
		case 'cs':
		case 'text/coffeescript':
			return getCoffeeScriptCompiler();
		case 'javascript':
		case 'java-script':
		case 'js':
		case 'text/javascript':
			return jsCompiler;
		default:
			throw new VMError(`Unsupported compiler '${compiler}'.`);
	}
}

/**
 * Remove the shebang from source code.
 * 
 * @private
 * @param {string} code - Code from which to remove the shebang.
 * @return {string} code without the shebang.
 */
function removeShebang(code) {
	if (!code.startsWith('#!')) return code;
	return '//' + code.substr(2);
}

/**
 * Class Script
 *
 * @public
 */
class VMScript {

	/**
	 * The script code with wrapping. If set will invalidate the cache.<br>
	 * Writable only for backwards compatibility.
	 * 
	 * @public
	 * @readonly
	 * @member {string} code
	 * @memberOf VMScript#
	 */

	/**
	 * The filename used for this script.
	 * 
	 * @public
	 * @readonly
	 * @since v3.9.0
	 * @member {string} filename
	 * @memberOf VMScript#
	 */

	/**
	 * The line offset use for stack traces.
	 * 
	 * @public
	 * @readonly
	 * @since v3.9.0
	 * @member {number} lineOffset
	 * @memberOf VMScript#
	 */

	/**
	 * The column offset use for stack traces.
	 * 
	 * @public
	 * @readonly
	 * @since v3.9.0
	 * @member {number} columnOffset
	 * @memberOf VMScript#
	 */

	/**
	 * The compiler to use to get the JavaScript code.
	 * 
	 * @public
	 * @readonly
	 * @since v3.9.0
	 * @member {(string|compileCallback)} compiler
	 * @memberOf VMScript#
	 */

	/**
	 * The prefix for the script.
	 * 
	 * @private
	 * @member {string} _prefix
	 * @memberOf VMScript#
	 */

	/**
	 * The suffix for the script.
	 * 
	 * @private
	 * @member {string} _suffix
	 * @memberOf VMScript#
	 */

	/**
	 * The compiled vm.Script for the VM or if not compiled <code>null</code>.
	 * 
	 * @private
	 * @member {?vm.Script} _compiledVM
	 * @memberOf VMScript#
	 */

	/**
	 * The compiled vm.Script for the NodeVM or if not compiled <code>null</code>.
	 * 
	 * @private
	 * @member {?vm.Script} _compiledNodeVM
	 * @memberOf VMScript#
	 */

	/**
	 * The resolved compiler to use to get the JavaScript code.
	 * 
	 * @private
	 * @readonly
	 * @member {compileCallback} _compiler
	 * @memberOf VMScript#
	 */

	/**
	 * The script to run without wrapping.
	 * 
	 * @private
	 * @member {string} _code
	 * @memberOf VMScript#
	 */

	/**
	 * Create VMScript instance.
	 *
	 * @public
	 * @param {string} code - Code to run.
	 * @param {(string|Object)} [options] - Options map or filename.
	 * @param {string} [options.filename="vm.js"] - Filename that shows up in any stack traces produced from this script.
	 * @param {number} [options.lineOffset=0] - Passed to vm.Script options.
	 * @param {number} [options.columnOffset=0] - Passed to vm.Script options.
	 * @param {(string|compileCallback)} [options.compiler="javascript"] - The compiler to use.
	 * @throws {VMError} If the compiler is unknown or if coffee-script was requested but the module not found.
	 */
	constructor(code, options) {
		const sCode = `${code}`;
		let useFileName;
		let useOptions;
		if (arguments.length === 2) {
			if (typeof options === 'object' && options.toString === Object.prototype.toString) {
				useOptions = options || {};
				useFileName = useOptions.filename;
			} else {
				useOptions = {};
				useFileName = options;
			}
		} else if (arguments.length > 2) {
			// We do it this way so that there are no more arguments in the function.
			// eslint-disable-next-line prefer-rest-params
			useOptions = arguments[2] || {};
			useFileName = options || useOptions.filename;
		} else {
			useOptions = {};
		}

		const {
			compiler = 'javascript',
			lineOffset = 0,
			columnOffset = 0
		} = useOptions;

		// Throw if the compiler is unknown.
		const resolvedCompiler = lookupCompiler(compiler);

		Object.defineProperties(this, {
			code: {
				// Put this here so that it is enumerable, and looks like a property.
				get() {
					return this._prefix + this._code + this._suffix;
				},
				set(value) {
					const strNewCode = String(value);
					if (strNewCode === this._code && this._prefix === '' && this._suffix === '') return;
					this._code = strNewCode;
					this._prefix = '';
					this._suffix = '';
					this._compiledVM = null;
					this._compiledNodeVM = null;
					this._compiledCode = null;
				},
				enumerable: true
			},
			filename: {
				value: useFileName || 'vm.js',
				enumerable: true
			},
			lineOffset: {
				value: lineOffset,
				enumerable: true
			},
			columnOffset: {
				value: columnOffset,
				enumerable: true
			},
			compiler: {
				value: compiler,
				enumerable: true
			},
			_code: {
				value: sCode,
				writable: true
			},
			_prefix: {
				value: '',
				writable: true
			},
			_suffix: {
				value: '',
				writable: true
			},
			_compiledVM: {
				value: null,
				writable: true
			},
			_compiledNodeVM: {
				value: null,
				writable: true
			},
			_compiledCode: {
				value: null,
				writable: true
			},
			_compiler: {value: resolvedCompiler}
		});
	}

	/**
	 * Wraps the code.<br>
	 * This will replace the old wrapping.<br>
	 * Will invalidate the code cache.
	 *
	 * @public
	 * @deprecated Since v3.9.0. Wrap your code before passing it into the VMScript object.
	 * @param {string} prefix - String that will be appended before the script code.
	 * @param {script} suffix - String that will be appended behind the script code.
	 * @return {this} This for chaining.
	 * @throws {TypeError} If prefix or suffix is a Symbol.
	 */
	wrap(prefix, suffix) {
		const strPrefix = `${prefix}`;
		const strSuffix = `${suffix}`;
		if (this._prefix === strPrefix && this._suffix === strSuffix) return this;
		this._prefix = strPrefix;
		this._suffix = strSuffix;
		this._compiledVM = null;
		this._compiledNodeVM = null;
		return this;
	}

	/**
	 * Compile this script. <br>
	 * This is useful to detect syntax errors in the script.
	 *
	 * @public
	 * @return {this} This for chaining.
	 * @throws {SyntaxError} If there is a syntax error in the script.
	 */
	compile() {
		this._compileVM();
		return this;
	}

	/**
	 * Get the compiled code.
	 * 
	 * @private
	 * @return {string} The code.
	 */
	getCompiledCode() {
		if (!this._compiledCode) {
			this._compiledCode = this._compiler(this._prefix + removeShebang(this._code) + this._suffix, this.filename);
		}
		return this._compiledCode;
	}

	/**
	 * Compiles this script to a vm.Script.
	 * 
	 * @private
	 * @param {string} prefix - JavaScript code that will be used as prefix.
	 * @param {string} suffix - JavaScript code that will be used as suffix.
	 * @return {vm.Script} The compiled vm.Script.
	 * @throws {SyntaxError} If there is a syntax error in the script.
	 */
	_compile(prefix, suffix) {
		return new vm.Script(prefix + this.getCompiledCode() + suffix, {
			filename: this.filename,
			displayErrors: false,
			lineOffset: this.lineOffset,
			columnOffset: this.columnOffset,
			importModuleDynamically
		});
	}

	/**
	 * Will return the cached version of the script intended for VM or compile it.
	 * 
	 * @private
	 * @return {vm.Script} The compiled script
	 * @throws {SyntaxError} If there is a syntax error in the script.
	 */
	_compileVM() {
		let script = this._compiledVM;
		if (!script) {
			this._compiledVM = script = this._compile('', '');
		}
		return script;
	}

	/**
	 * Will return the cached version of the script intended for NodeVM or compile it.
	 * 
	 * @private
	 * @return {vm.Script} The compiled script
	 * @throws {SyntaxError} If there is a syntax error in the script.
	 */
	_compileNodeVM() {
		let script = this._compiledNodeVM;
		if (!script) {
			this._compiledNodeVM = script = this._compile('(function (exports, require, module, __filename, __dirname) { ', '\n})');
		}
		return script;
	}

}

/**
 * 
 * This callback will be called and has a specific time to finish.<br>
 * No parameters will be supplied.<br>
 * If parameters are required, use a closure.
 * 
 * @private
 * @callback runWithTimeout
 * @return {*} 
 * 
 */

/**
 * Run a function with a specific timeout.
 * 
 * @private
 * @param {runWithTimeout} fn - Function to run with the specific timeout.
 * @param {number} timeout - The amount of time to give the function to finish.
 * @return {*} The value returned by the function.
 * @throws {Error} If the function took to long.
 */
function doWithTimeout(fn, timeout) {
	let ctx = CACHE.timeoutContext;
	let script = CACHE.timeoutScript;
	if (!ctx) {
		CACHE.timeoutContext = ctx = vm.createContext();
		CACHE.timeoutScript = script = new vm.Script('fn()', {
			filename: 'timeout_bridge.js',
			displayErrors: false,
			importModuleDynamically
		});
	}
	ctx.fn = fn;
	try {
		return script.runInContext(ctx, {
			displayErrors: false,
			importModuleDynamically,
			timeout
		});
	} finally {
		ctx.fn = null;
	}
}

/**
 * Creates the hook to check for the use of async.
 * 
 * @private
 * @param {*} internal - The internal vm object.
 * @return {*} The hook function
 */
function makeCheckAsync(internal) {
	return (hook, args) => {
		if (hook === 'function' || hook === 'generator_function' || hook === 'eval' || hook === 'run') {
			const funcConstructor = internal.Function;
			if (hook === 'eval') {
				const script = args[0];
				args = [script];
				if (typeof(script) !== 'string') return args;
			} else {
				// Next line throws on Symbol, this is the same behavior as function constructor calls
				args = args.map(arg => `${arg}`);
			}
			if (args.findIndex(arg => /\basync\b/.test(arg)) === -1) return args;
			const asyncMapped = args.map(arg => arg.replace(/async/g, 'a\\u0073ync'));
			try {
				// Note: funcConstructor is a Sandbox object, however, asyncMapped are only strings.
				funcConstructor(...asyncMapped);
			} catch (u) {
				// u is a sandbox object
				// Some random syntax error or error because of async.

				// First report real syntax errors
				try {
					// Note: funcConstructor is a Sandbox object, however, args are only strings.
					funcConstructor(...args);
				} catch (e) {
					throw internal.Decontextify.value(e);
				}
				// Then async error
				throw new VMError('Async not available');
			}
			return args;
		}
		throw new VMError('Async not available');
	};
}

/**
 * Class VM.
 *
 * @public
 */
class VM extends EventEmitter {

	/**
	 * The timeout for {@link VM#run} calls.
	 *
	 * @public
	 * @since v3.9.0
	 * @member {number} timeout
	 * @memberOf VM#
	 */

	/**
	 * Get the global sandbox object.
	 *
	 * @public
	 * @readonly
	 * @since v3.9.0
	 * @member {Object} sandbox
	 * @memberOf VM#
	 */

	/**
	 * The compiler to use to get the JavaScript code.
	 * 
	 * @public
	 * @readonly
	 * @since v3.9.0
	 * @member {(string|compileCallback)} compiler
	 * @memberOf VM#
	 */

	/**
	 * The context for this sandbox.
	 * 
	 * @private
	 * @readonly
	 * @member {Object} _context
	 * @memberOf VM#
	 */

	/**
	 * The internal methods for this sandbox.
	 * 
	 * @private
	 * @readonly
	 * @member {{Contextify: Object, Decontextify: Object, Buffer: Object, sandbox:Object}} _internal
	 * @memberOf VM#
	 */

	/**
	 * The resolved compiler to use to get the JavaScript code.
	 * 
	 * @private
	 * @readonly
	 * @member {compileCallback} _compiler
	 * @memberOf VM#
	 */

	/**
	 * The hook called when some events occurs.
	 * 
	 * @private
	 * @readonly
	 * @since v3.9.2
	 * @member {Function} _hook
	 * @memberOf VM#
	 */

	/**
	 * Create a new VM instance.
	 *
	 * @public
	 * @param {Object} [options] - VM options.
	 * @param {number} [options.timeout] - The amount of time until a call to {@link VM#run} will timeout.
	 * @param {Object} [options.sandbox] - Objects that will be copied into the global object of the sandbox.
	 * @param {(string|compileCallback)} [options.compiler="javascript"] - The compiler to use.
	 * @param {boolean} [options.eval=true] - Allow the dynamic evaluation of code via eval(code) or Function(code)().<br>
	 * Only available for node v10+.
	 * @param {boolean} [options.wasm=true] - Allow to run wasm code.<br>
	 * Only available for node v10+.
	 * @param {boolean} [options.fixAsync=false] - Filters for async functions.
	 * @throws {VMError} If the compiler is unknown.
	 */
	constructor(options = {}) {
		super();

		// Read all options
		const {
			timeout,
			sandbox,
			compiler = 'javascript'
		} = options;
		const allowEval = options.eval !== false;
		const allowWasm = options.wasm !== false;
		const fixAsync = !!options.fixAsync;

		// Early error if sandbox is not an object.
		if (sandbox && 'object' !== typeof sandbox) {
			throw new VMError('Sandbox must be object.');
		}

		// Early error if compiler can't be found.
		const resolvedCompiler = lookupCompiler(compiler);

		// Create a new context for this vm.
		const _context = vm.createContext(undefined, {
			codeGeneration: {
				strings: allowEval,
				wasm: allowWasm
			}
		});

		// Create the bridge between the host and the sandbox.
		const _internal = CACHE.contextifyScript.runInContext(_context, DEFAULT_RUN_OPTIONS).call(_context, require, HOST);

		const hook = fixAsync ? makeCheckAsync(_internal) : null;

		// Define the properties of this object.
		// Use Object.defineProperties here to be able to
		// hide and set properties write only.
		Object.defineProperties(this, {
			timeout: {
				value: timeout,
				writable: true,
				enumerable: true
			},
			compiler: {
				value: compiler,
				enumerable: true
			},
			sandbox: {
				value: _internal.sandbox,
				enumerable: true
			},
			_context: {value: _context},
			_internal: {value: _internal},
			_compiler: {value: resolvedCompiler},
			_hook: {value: hook}
		});

		if (hook) {
			if (!CACHE.hookScript) {
				CACHE.hookScript = loadAndCompileScript(`${__dirname}/fixasync.js`, '(function() { ', '\n})');
				CACHE.getGlobalScript = new vm.Script('this', {
					filename: 'get_global.js',
					displayErrors: false,
					importModuleDynamically
				});
				try {
					CACHE.getGeneratorFunctionScript = new vm.Script('(function*(){}).constructor', {
						filename: 'get_generator_function.js',
						displayErrors: false,
						importModuleDynamically
					});
				} catch (ex) {}
				try {
					CACHE.getAsyncFunctionScript = new vm.Script('(async function(){}).constructor', {
						filename: 'get_async_function.js',
						displayErrors: false,
						importModuleDynamically
					});
				} catch (ex) {}
				try {
					CACHE.getAsyncGeneratorFunctionScript = new vm.Script('(async function*(){}).constructor', {
						filename: 'get_async_generator_function.js',
						displayErrors: false,
						importModuleDynamically
					});
				} catch (ex) {}
			}
			const internal = {
				__proto__: null,
				global: CACHE.getGlobalScript.runInContext(_context, DEFAULT_RUN_OPTIONS),
				internal: _internal,
				host: HOST,
				hook
			};
			if (CACHE.getGeneratorFunctionScript) {
				try {
					internal.GeneratorFunction = CACHE.getGeneratorFunctionScript.runInContext(_context, DEFAULT_RUN_OPTIONS);
				} catch (ex) {}
			}
			if (CACHE.getAsyncFunctionScript) {
				try {
					internal.AsyncFunction = CACHE.getAsyncFunctionScript.runInContext(_context, DEFAULT_RUN_OPTIONS);
				} catch (ex) {}
			}
			if (CACHE.getAsyncGeneratorFunctionScript) {
				try {
					internal.AsyncGeneratorFunction = CACHE.getAsyncGeneratorFunctionScript.runInContext(_context, DEFAULT_RUN_OPTIONS);
				} catch (ex) {}
			}
			CACHE.hookScript.runInContext(_context, DEFAULT_RUN_OPTIONS).call(internal);
		}

		// prepare global sandbox
		if (sandbox) {
			this.setGlobals(sandbox);
		}
	}

	/**
	 * Adds all the values to the globals.
	 * 
	 * @public
	 * @since v3.9.0
	 * @param {Object} values - All values that will be added to the globals.
	 * @return {this} This for chaining.
	 * @throws {*} If the setter of a global throws an exception it is propagated. And the remaining globals will not be written.
	 */
	setGlobals(values) {
		for (const name in values) {
			if (Object.prototype.hasOwnProperty.call(values, name)) {
				this._internal.Contextify.setGlobal(name, values[name]);
			}
		}
		return this;
	}

	/**
	 * Set a global value.
	 * 
	 * @public
	 * @since v3.9.0
	 * @param {string} name - The name of the global.
	 * @param {*} value - The value of the global.
	 * @return {this} This for chaining.
	 * @throws {*} If the setter of the global throws an exception it is propagated.
	 */
	setGlobal(name, value) {
		this._internal.Contextify.setGlobal(name, value);
		return this;
	}

	/**
	 * Get a global value.
	 * 
	 * @public
	 * @since v3.9.0
	 * @param {string} name - The name of the global.
	 * @return {*} The value of the global.
	 * @throws {*} If the getter of the global throws an exception it is propagated.
	 */
	getGlobal(name) {
		return this._internal.Contextify.getGlobal(name);
	}

	/**
	 * Freezes the object inside VM making it read-only. Not available for primitive values.
	 *
	 * @public
	 * @param {*} value - Object to freeze.
	 * @param {string} [globalName] - Whether to add the object to global.
	 * @return {*} Object to freeze.
	 * @throws {*} If the setter of the global throws an exception it is propagated.
	 */
	freeze(value, globalName) {
		this._internal.Contextify.readonly(value);
		if (globalName) this._internal.Contextify.setGlobal(globalName, value);
		return value;
	}

	/**
	 * Protects the object inside VM making impossible to set functions as it's properties. Not available for primitive values.
	 *
	 * @public
	 * @param {*} value - Object to protect.
	 * @param {string} [globalName] - Whether to add the object to global.
	 * @return {*} Object to protect.
	 * @throws {*} If the setter of the global throws an exception it is propagated.
	 */
	protect(value, globalName) {
		this._internal.Contextify.protected(value);
		if (globalName) this._internal.Contextify.setGlobal(globalName, value);
		return value;
	}

	/**
	 * Run the code in VM.
	 *
	 * @public
	 * @param {(string|VMScript)} code - Code to run.
	 * @param {string} [filename="vm.js"] - Filename that shows up in any stack traces produced from this script.<br>
	 * This is only used if code is a String.
	 * @return {*} Result of executed code.
	 * @throws {SyntaxError} If there is a syntax error in the script.
	 * @throws {Error} An error is thrown when the script took to long and there is a timeout.
	 * @throws {*} If the script execution terminated with an exception it is propagated.
	 */
	run(code, filename) {
		let script;
		if (code instanceof VMScript) {
			if (this._hook) {
				const scriptCode = code.getCompiledCode();
				const changed = this._hook('run', [scriptCode])[0];
				if (changed === scriptCode) {
					script = code._compileVM();
				} else {
					script = new vm.Script(changed, {
						filename: code.filename,
						displayErrors: false,
						importModuleDynamically
					});
				}
			} else {
				script = code._compileVM();
			}
		} else {
			const useFileName = filename || 'vm.js';
			let scriptCode = this._compiler(code, useFileName);
			if (this._hook) {
				scriptCode = this._hook('run', [scriptCode])[0];
			}
			// Compile the script here so that we don't need to create a instance of VMScript.
			script = new vm.Script(scriptCode, {
				filename: useFileName,
				displayErrors: false,
				importModuleDynamically
			});
		}

		if (!this.timeout) {
			// If no timeout is given, directly run the script.
			try {
				return this._internal.Decontextify.value(script.runInContext(this._context, DEFAULT_RUN_OPTIONS));
			} catch (e) {
				throw this._internal.Decontextify.value(e);
			}
		}

		return doWithTimeout(()=>{
			try {
				return this._internal.Decontextify.value(script.runInContext(this._context, DEFAULT_RUN_OPTIONS));
			} catch (e) {
				throw this._internal.Decontextify.value(e);
			}
		}, this.timeout);
	}

	/**
	 * Run the code in VM.
	 *
	 * @public
	 * @since v3.9.0
	 * @param {string} filename - Filename of file to load and execute in a NodeVM.
	 * @return {*} Result of executed code.
	 * @throws {Error} If filename is not a valid filename.
	 * @throws {SyntaxError} If there is a syntax error in the script.
	 * @throws {Error} An error is thrown when the script took to long and there is a timeout.
	 * @throws {*} If the script execution terminated with an exception it is propagated.
	 */
	runFile(filename) {
		const resolvedFilename = pa.resolve(filename);

		if (!fs.existsSync(resolvedFilename)) {
			throw new VMError(`Script '${filename}' not found.`);
		}

		if (fs.statSync(resolvedFilename).isDirectory()) {
			throw new VMError('Script must be file, got directory.');
		}

		return this.run(fs.readFileSync(resolvedFilename, 'utf8'), resolvedFilename);
	}

}

/**
 * Event caused by a <code>console.debug</code> call if <code>options.console="redirect"</code> is specified.
 *
 * @public
 * @event NodeVM."console.debug"
 * @type {...*}
 */

/**
 * Event caused by a <code>console.log</code> call if <code>options.console="redirect"</code> is specified.
 *
 * @public
 * @event NodeVM."console.log"
 * @type {...*}
 */

/**
 * Event caused by a <code>console.info</code> call if <code>options.console="redirect"</code> is specified.
 *
 * @public
 * @event NodeVM."console.info"
 * @type {...*}
 */

/**
 * Event caused by a <code>console.warn</code> call if <code>options.console="redirect"</code> is specified.
 *
 * @public
 * @event NodeVM."console.warn"
 * @type {...*}
 */

/**
 * Event caused by a <code>console.error</code> call if <code>options.console="redirect"</code> is specified.
 *
 * @public
 * @event NodeVM."console.error"
 * @type {...*}
 */

/**
 * Event caused by a <code>console.dir</code> call if <code>options.console="redirect"</code> is specified.
 *
 * @public
 * @event NodeVM."console.dir"
 * @type {...*}
 */

/**
 * Event caused by a <code>console.trace</code> call if <code>options.console="redirect"</code> is specified.
 *
 * @public
 * @event NodeVM."console.trace"
 * @type {...*}
 */

/**
 * Class NodeVM.
 *
 * @public
 * @extends {VM}
 * @extends {EventEmitter}
 */
class NodeVM extends VM {

	/**
	 * Create a new NodeVM instance.<br>
	 *
	 * Unlike VM, NodeVM lets you use require same way like in regular node.<br>
	 * 
	 * However, it does not use the timeout.
	 *
	 * @public
	 * @param {Object} [options] - VM options.
	 * @param {Object} [options.sandbox] - Objects that will be copied into the global object of the sandbox.
	 * @param {(string|compileCallback)} [options.compiler="javascript"] - The compiler to use.
	 * @param {boolean} [options.eval=true] - Allow the dynamic evaluation of code via eval(code) or Function(code)().<br>
	 * Only available for node v10+.
	 * @param {boolean} [options.wasm=true] - Allow to run wasm code.<br>
	 * Only available for node v10+.
	 * @param {("inherit"|"redirect"|"off")} [options.console="inherit"] - Sets the behavior of the console in the sandbox.
	 * <code>inherit</code> to enable console, <code>redirect</code> to redirect to events, <code>off</code> to disable console.
	 * @param {Object|boolean} [options.require=false] - Allow require inside the sandbox.
	 * @param {(boolean|string[]|Object)} [options.require.external=false] - true, an array of allowed external modules or an object.
	 * @param {(string[])} [options.require.external.modules] - Array of allowed external modules. Also supports wildcards, so specifying ['@scope/*-ver-??], 
	 * for instance, will allow using all modules having a name of the form @scope/something-ver-aa, @scope/other-ver-11, etc.
	 * @param {boolean} [options.require.external.transitive=false] - Boolean which indicates if transitive dependencies of external modules are allowed.
	 * @param {string[]} [options.require.builtin=[]] - Array of allowed builtin modules, accepts ["*"] for all.
	 * @param {(string|string[])} [options.require.root] - Restricted path(s) where local modules can be required. If omitted every path is allowed.
	 * @param {Object} [options.require.mock] - Collection of mock modules (both external or builtin).
	 * @param {("host"|"sandbox")} [options.require.context="host"] - <code>host</code> to require modules in host and proxy them to sandbox.
	 * <code>sandbox</code> to load, compile and require modules in sandbox.
	 * Builtin modules except <code>events</code> always required in host and proxied to sandbox.
	 * @param {string[]} [options.require.import] - Array of modules to be loaded into NodeVM on start.
	 * @param {resolveCallback} [options.require.resolve] - An additional lookup function in case a module wasn't
	 * found in one of the traditional node lookup paths.
	 * @param {boolean} [options.nesting=false] - Allow nesting of VMs.
	 * @param {("commonjs"|"none")} [options.wrapper="commonjs"] - <code>commonjs</code> to wrap script into CommonJS wrapper, 
	 * <code>none</code> to retrieve value returned by the script.
	 * @param {string[]} [options.sourceExtensions=["js"]] - Array of file extensions to treat as source code.
	 * @param {string[]} [options.argv=[]] - Array of arguments passed to <code>process.argv</code>. 
	 * This object will not be copied and the script can change this object.
	 * @param {Object} [options.env={}] - Environment map passed to <code>process.env</code>. 
	 * This object will not be copied and the script can change this object.
	 * @throws {VMError} If the compiler is unknown.
	 */
	constructor(options = {}) {
		const sandbox = options.sandbox;

		// Throw this early
		if (sandbox && 'object' !== typeof sandbox) {
			throw new VMError('Sandbox must be object.');
		}

		super({compiler: options.compiler, eval: options.eval, wasm: options.wasm});

		// defaults
		Object.defineProperty(this, 'options', {value: {
			console: options.console || 'inherit',
			require: options.require || false,
			nesting: options.nesting || false,
			wrapper: options.wrapper || 'commonjs',
			sourceExtensions: options.sourceExtensions || ['js']
		}});

		let sandboxScript = CACHE.sandboxScript;
		if (!sandboxScript) {
			CACHE.sandboxScript = sandboxScript = loadAndCompileScript(`${__dirname}/sandbox.js`,
				'(function (vm, host, Contextify, Decontextify, Buffer, options) { ', '\n})');
		}

		const closure = sandboxScript.runInContext(this._context, DEFAULT_RUN_OPTIONS);

		Object.defineProperty(this, '_prepareRequire', {
			value: closure.call(this._context, this, HOST, this._internal.Contextify, this._internal.Decontextify, this._internal.Buffer, options)
		});

		// prepare global sandbox
		if (sandbox) {
			this.setGlobals(sandbox);
		}

		if (this.options.require && this.options.require.import) {
			if (Array.isArray(this.options.require.import)) {
				for (let i = 0, l = this.options.require.import.length; i < l; i++) {
					this.require(this.options.require.import[i]);
				}
			} else {
				this.require(this.options.require.import);
			}
		}
	}

	/**
	 * @ignore
	 * @deprecated Just call the method yourself like <code>method(args);</code>
	 * @param {function} method - Function to invoke.
	 * @param {...*} args - Arguments to pass to the function.
	 * @return {*} Return value of the function.
	 * @todo Can we remove this function? It even had a bug that would use args as this parameter.
	 * @throws {*} Rethrows anything the method throws.
	 * @throws {VMError} If method is not a function.
	 * @throws {Error} If method is a class.
	 */
	call(method, ...args) {
		if ('function' === typeof method) {
			return method(...args);
		} else {
			throw new VMError('Unrecognized method type.');
		}
	}

	/**
	 * Require a module in VM and return it's exports.
	 *
	 * @public
	 * @param {string} module - Module name.
	 * @return {*} Exported module.
	 * @throws {*} If the module couldn't be found or loading it threw an error.
	 */
	require(module) {
		return this.run(`module.exports = require('${module}');`, 'vm.js');
	}

	/**
	 * Run the code in NodeVM.
	 *
	 * First time you run this method, code is executed same way like in node's regular `require` - it's executed with
	 * `module`, `require`, `exports`, `__dirname`, `__filename` variables and expect result in `module.exports'.
	 *
	 * @param {(string|VMScript)} code - Code to run.
	 * @param {string} [filename] - Filename that shows up in any stack traces produced from this script.<br>
	 * This is only used if code is a String.
	 * @return {*} Result of executed code.
	 * @throws {SyntaxError} If there is a syntax error in the script.
	 * @throws {*} If the script execution terminated with an exception it is propagated.
	 * @fires NodeVM."console.debug"
	 * @fires NodeVM."console.log"
	 * @fires NodeVM."console.info"
	 * @fires NodeVM."console.warn"
	 * @fires NodeVM."console.error"
	 * @fires NodeVM."console.dir"
	 * @fires NodeVM."console.trace"
	 */
	run(code, filename) {
		let dirname;
		let resolvedFilename;
		let script;

		if (code instanceof VMScript) {
			script = code._compileNodeVM();
			resolvedFilename = pa.resolve(code.filename);
			dirname = pa.dirname(resolvedFilename);
		} else {
			const unresolvedFilename = filename || 'vm.js';
			if (filename) {
				resolvedFilename = pa.resolve(filename);
				dirname = pa.dirname(resolvedFilename);
			} else {
				resolvedFilename = null;
				dirname = null;
			}
			script = new vm.Script('(function (exports, require, module, __filename, __dirname) { ' +
					this._compiler(code, unresolvedFilename) + '\n})', {
				filename: unresolvedFilename,
				displayErrors: false,
				importModuleDynamically
			});
		}

		const wrapper = this.options.wrapper;
		const module = this._internal.Contextify.makeModule();

		try {
			const closure = script.runInContext(this._context, DEFAULT_RUN_OPTIONS);

			const returned = closure.call(this._context, module.exports, this._prepareRequire(dirname), module, resolvedFilename, dirname);

			return this._internal.Decontextify.value(wrapper === 'commonjs' ? module.exports : returned);
		} catch (e) {
			throw this._internal.Decontextify.value(e);
		}

	}

	/**
	 * Create NodeVM and run code inside it.
	 *
	 * @public
	 * @static
	 * @param {string} script - Code to execute.
	 * @param {string} [filename] - File name (used in stack traces only).
	 * @param {Object} [options] - VM options.
	 * @param {string} [options.filename] - File name (used in stack traces only). Used if <code>filename</code> is omitted.
	 * @return {*} Result of executed code.
	 * @see {@link NodeVM} for the options.
	 * @throws {SyntaxError} If there is a syntax error in the script.
	 * @throws {*} If the script execution terminated with an exception it is propagated.
	 */
	static code(script, filename, options) {
		let unresolvedFilename;
		if (filename != null) {
			if ('object' === typeof filename) {
				options = filename;
				unresolvedFilename = options.filename;
			} else if ('string' === typeof filename) {
				unresolvedFilename = filename;
			} else {
				throw new VMError('Invalid arguments.');
			}
		} else if ('object' === typeof options) {
			unresolvedFilename = options.filename;
		}

		if (arguments.length > 3) {
			throw new VMError('Invalid number of arguments.');
		}

		const resolvedFilename = typeof unresolvedFilename === 'string' ? pa.resolve(unresolvedFilename) : undefined;

		return new NodeVM(options).run(script, resolvedFilename);
	}

	/**
	 * Create NodeVM and run script from file inside it.
	 *
	 * @public
	 * @static
	 * @param {string} filename - Filename of file to load and execute in a NodeVM.
	 * @param {Object} [options] - NodeVM options.
	 * @return {*} Result of executed code.
	 * @see {@link NodeVM} for the options.
	 * @throws {Error} If filename is not a valid filename.
	 * @throws {SyntaxError} If there is a syntax error in the script.
	 * @throws {*} If the script execution terminated with an exception it is propagated.
	 */
	static file(filename, options) {
		const resolvedFilename = pa.resolve(filename);

		if (!fs.existsSync(resolvedFilename)) {
			throw new VMError(`Script '${filename}' not found.`);
		}

		if (fs.statSync(resolvedFilename).isDirectory()) {
			throw new VMError('Script must be file, got directory.');
		}

		return new NodeVM(options).run(fs.readFileSync(resolvedFilename, 'utf8'), resolvedFilename);
	}
}

/**
 * VMError.
 *
 * @public
 * @extends {Error}
 */
class VMError extends Error {

	/**
	 * Create VMError instance.
	 *
	 * @public
	 * @param {string} message - Error message.
	 */
	constructor(message) {
		super(message);

		this.name = 'VMError';

		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Host objects
 * 
 * @private
 */
const HOST = {
	version: parseInt(process.versions.node.split('.')[0]),
	require,
	process,
	console,
	setTimeout,
	setInterval,
	setImmediate,
	clearTimeout,
	clearInterval,
	clearImmediate,
	String,
	Number,
	Buffer,
	Boolean,
	Array,
	Date,
	Error,
	EvalError,
	RangeError,
	ReferenceError,
	SyntaxError,
	TypeError,
	URIError,
	RegExp,
	Function,
	Object,
	VMError,
	Proxy,
	Reflect,
	Map,
	WeakMap,
	Set,
	WeakSet,
	Promise,
	Symbol,
	INSPECT_MAX_BYTES,
	VM,
	NodeVM,
	helpers
};

exports.VMError = VMError;
exports.NodeVM = NodeVM;
exports.VM = VM;
exports.VMScript = VMScript;
