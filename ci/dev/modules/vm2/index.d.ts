import {EventEmitter} from 'events';

/**
 *  Require options for a VM
 */
export interface VMRequire {
  /** Array of allowed builtin modules, accepts ["*"] for all (default: none) */
  builtin?: string[];
  /*
   * `host` (default) to require modules in host and proxy them to sandbox. `sandbox` to load, compile and
   * require modules in sandbox. Builtin modules except `events` always required in host and proxied to sandbox
   */
  context?: "host" | "sandbox";
  /** `true`, an array of allowed external modules or an object with external options (default: `false`) */
  external?: boolean | string[] | { modules: string[], transitive: boolean };
  /** Array of modules to be loaded into NodeVM on start. */
  import?: string[];
  /** Restricted path(s) where local modules can be required (default: every path). */
  root?: string | string[];
  /** Collection of mock modules (both external or builtin). */
  mock?: any;
  /* An additional lookup function in case a module wasn't found in one of the traditional node lookup paths. */
  resolve?: (moduleName: string, parentDirname: string) => string;
}

/**
 * A custom compiler function for all of the JS that comes
 * into the VM
 */
type CompilerFunction = (code: string, filename: string) => string;

/**
 *  Options for creating a VM
 */
export interface VMOptions {
  /**
   * `javascript` (default) or `coffeescript` or custom compiler function (which receives the code, and it's filepath).
   *  The library expects you to have coffee-script pre-installed if the compiler is set to `coffeescript`.
   */
  compiler?: "javascript" | "coffeescript" | CompilerFunction;
  /** VM's global object. */
  sandbox?: any;
  /**
   * Script timeout in milliseconds.  Timeout is only effective on code you run through `run`.
   * Timeout is NOT effective on any method returned by VM.
   */
  timeout?: number;
  /**
   * If set to `false` any calls to eval or function constructors (`Function`, `GeneratorFunction`, etc) will throw an
   * `EvalError` (default: `true`).
   */
  eval?: boolean;
  /**
   * If set to `false` any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError` (default: `true`).
   */
  wasm?: boolean;
  /**
   * If set to `true` any attempt to run code using async will throw a `VMError` (default: `false`).
   */
  fixAsync?: boolean;
}

/**
 *  Options for creating a NodeVM
 */
export interface NodeVMOptions extends VMOptions {
  /** `inherit` to enable console, `redirect` to redirect to events, `off` to disable console (default: `inherit`). */
  console?: "inherit" | "redirect" | "off";
  /** `true` or an object to enable `require` options (default: `false`). */
  require?: true | VMRequire;
  /** `true` to enable VMs nesting (default: `false`). */
  nesting?: boolean;
  /** `commonjs` (default) to wrap script into CommonJS wrapper, `none` to retrieve value returned by the script. */
  wrapper?: "commonjs" | "none";
  /** File extensions that the internal module resolver should accept. */
  sourceExtensions?: string[];
  /** 
   * Array of arguments passed to `process.argv`. 
	 * This object will not be copied and the script can change this object. 
   */
  argv?: string[];
  /** 
   * Environment map passed to `process.env`. 
	 * This object will not be copied and the script can change this object.
   */
  env?: any;
}

/**
 * VM is a simple sandbox, without `require` feature, to synchronously run an untrusted code.
 * Only JavaScript built-in objects + Buffer are available. Scheduling functions
 * (`setInterval`, `setTimeout` and `setImmediate`) are not available by default.
 */
export class VM {
  constructor(options?: VMOptions);
  /** Direct access to the global sandbox object */
  readonly sandbox: any;
  /** Timeout to use for the run methods */
  timeout?: number;
  /** Runs the code */
  run(js: string, path?: string): any;
  /** Runs the VMScript object */
  run(script: VMScript): any;
  /** Runs the code in the specific file */
  runFile(filename: string): any;
  /** Loads all the values into the global object with the same names */
  setGlobals(values: any): this;
  /** Make a object visible as a global with a specific name */
  setGlobal(name: string, value: any): this;
  /** Get the global object with the specific name */
  getGlobal(name: string): any;
  /** Freezes the object inside VM making it read-only. Not available for primitive values. */
  freeze(object: any, name?: string): any;
  /** Protects the object inside VM making impossible to set functions as it's properties. Not available for primitive values */
  protect(object: any, name?: string): any;
}

/**
 * A VM with behavior more similar to running inside Node.
 */
export class NodeVM extends EventEmitter implements VM {
  constructor(options?: NodeVMOptions);

  /** Require a module in VM and return it's exports. */
  require(module: string): any;

   /**
   * Create NodeVM and run code inside it.
   *
   * @param {string} script Javascript code.
   * @param {string} [filename] File name (used in stack traces only).
   * @param {Object} [options] VM options.
   */
  static code(script: string, filename?: string, options?: NodeVMOptions): any;

  /**
   * Create NodeVM and run script from file inside it.
   *
   * @param {string} [filename] File name (used in stack traces only).
   * @param {Object} [options] VM options.
   */
  static file(filename: string, options?: NodeVMOptions): any;

   /** Direct access to the global sandbox object */
  readonly sandbox: any;
  /** Only here because of implements VM. Does nothing. */
  timeout?: number;
  /** Runs the code */
  run(js: string, path?: string): any;
  /** Runs the VMScript object */
  run(script: VMScript): any;
  /** Runs the code in the specific file */
  runFile(filename: string): any;
  /** Loads all the values into the global object with the same names */
  setGlobals(values: any): this;
  /** Make a object visible as a global with a specific name */
  setGlobal(name: string, value: any): this;
  /** Get the global object with the specific name */
  getGlobal(name: string): any;
  /** Freezes the object inside VM making it read-only. Not available for primitive values. */
  freeze(object: any, name?: string): any;
  /** Protects the object inside VM making impossible to set functions as it's properties. Not available for primitive values */
  protect(object: any, name?: string): any;
}

/**
 * You can increase performance by using pre-compiled scripts.
 * The pre-compiled VMScript can be run later multiple times. It is important to note that the code is not bound
 * to any VM (context); rather, it is bound before each run, just for that run.
 */
export class VMScript {
  constructor(code: string, path: string, options?: {
    lineOffset?: number;
    columnOffset?: number;
    compiler?: "javascript" | "coffeescript" | CompilerFunction;
  });
  constructor(code: string, options?: {
    filename?: string,
    lineOffset?: number;
    columnOffset?: number;
    compiler?: "javascript" | "coffeescript" | CompilerFunction;
  });
  readonly code: string;
  readonly filename: string;
  readonly lineOffset: number;
  readonly columnOffset: number;
  readonly compiler: "javascript" | "coffeescript" | CompilerFunction;
  /** 
   * Wraps the code 
   * @deprecated
   */
  wrap(prefix: string, postfix: string): this;
  /** Compiles the code. If called multiple times, the code is only compiled once. */
  compile(): this;
}

/** Custom Error class */
export class VMError extends Error {}
