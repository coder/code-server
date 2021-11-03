"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodeModuleForContext = exports.setContext = exports.createEvalAwarePartialHost = exports.EvalState = exports.createRepl = exports.REPL_NAME = exports.REPL_FILENAME = exports.STDIN_NAME = exports.STDIN_FILENAME = exports.EVAL_NAME = exports.EVAL_FILENAME = void 0;
const diff_1 = require("diff");
const os_1 = require("os");
const path_1 = require("path");
const repl_1 = require("repl");
const vm_1 = require("vm");
const index_1 = require("./index");
const fs_1 = require("fs");
const console_1 = require("console");
const Module = require("module");
/** @internal */
exports.EVAL_FILENAME = `[eval].ts`;
/** @internal */
exports.EVAL_NAME = `[eval]`;
/** @internal */
exports.STDIN_FILENAME = `[stdin].ts`;
/** @internal */
exports.STDIN_NAME = `[stdin]`;
/** @internal */
exports.REPL_FILENAME = '<repl>.ts';
/** @internal */
exports.REPL_NAME = '<repl>';
/**
 * Create a ts-node REPL instance.
 *
 * Usage example:
 *
 *     const repl = tsNode.createRepl()
 *     const service = tsNode.create({...repl.evalAwarePartialHost})
 *     repl.setService(service)
 *     repl.start()
 */
function createRepl(options = {}) {
    var _a, _b, _c, _d, _e;
    let service = options.service;
    const state = (_a = options.state) !== null && _a !== void 0 ? _a : new EvalState(path_1.join(process.cwd(), exports.REPL_FILENAME));
    const evalAwarePartialHost = createEvalAwarePartialHost(state, options.composeWithEvalAwarePartialHost);
    const stdin = (_b = options.stdin) !== null && _b !== void 0 ? _b : process.stdin;
    const stdout = (_c = options.stdout) !== null && _c !== void 0 ? _c : process.stdout;
    const stderr = (_d = options.stderr) !== null && _d !== void 0 ? _d : process.stderr;
    const _console = stdout === process.stdout && stderr === process.stderr
        ? console
        : new console_1.Console(stdout, stderr);
    const replService = {
        state: (_e = options.state) !== null && _e !== void 0 ? _e : new EvalState(path_1.join(process.cwd(), exports.EVAL_FILENAME)),
        setService,
        evalCode,
        nodeEval,
        evalAwarePartialHost,
        start,
        stdin,
        stdout,
        stderr,
        console: _console,
    };
    return replService;
    function setService(_service) {
        service = _service;
    }
    function evalCode(code) {
        return _eval(service, state, code);
    }
    function nodeEval(code, _context, _filename, callback) {
        let err = null;
        let result;
        // TODO: Figure out how to handle completion here.
        if (code === '.scope') {
            callback(err);
            return;
        }
        try {
            result = evalCode(code);
        }
        catch (error) {
            if (error instanceof index_1.TSError) {
                // Support recoverable compilations using >= node 6.
                if (repl_1.Recoverable && isRecoverable(error)) {
                    err = new repl_1.Recoverable(error);
                }
                else {
                    _console.error(error);
                }
            }
            else {
                err = error;
            }
        }
        return callback(err, result);
    }
    function start(code) {
        // TODO assert that service is set; remove all ! postfixes
        return startRepl(replService, service, state, code);
    }
}
exports.createRepl = createRepl;
/**
 * Eval state management. Stores virtual `[eval].ts` file
 */
class EvalState {
    constructor(path) {
        this.path = path;
        /** @internal */
        this.input = '';
        /** @internal */
        this.output = '';
        /** @internal */
        this.version = 0;
        /** @internal */
        this.lines = 0;
    }
}
exports.EvalState = EvalState;
function createEvalAwarePartialHost(state, composeWith) {
    function readFile(path) {
        if (path === state.path)
            return state.input;
        if (composeWith === null || composeWith === void 0 ? void 0 : composeWith.readFile)
            return composeWith.readFile(path);
        try {
            return fs_1.readFileSync(path, 'utf8');
        }
        catch (err) {
            /* Ignore. */
        }
    }
    function fileExists(path) {
        if (path === state.path)
            return true;
        if (composeWith === null || composeWith === void 0 ? void 0 : composeWith.fileExists)
            return composeWith.fileExists(path);
        try {
            const stats = fs_1.statSync(path);
            return stats.isFile() || stats.isFIFO();
        }
        catch (err) {
            return false;
        }
    }
    return { readFile, fileExists };
}
exports.createEvalAwarePartialHost = createEvalAwarePartialHost;
/**
 * Evaluate the code snippet.
 */
function _eval(service, state, input) {
    const lines = state.lines;
    const isCompletion = !/\n$/.test(input);
    const undo = appendEval(state, input);
    let output;
    // Based on https://github.com/nodejs/node/blob/92573721c7cff104ccb82b6ed3e8aa69c4b27510/lib/repl.js#L457-L461
    function adjustUseStrict(code) {
        // "void 0" keeps the repl from returning "use strict" as the result
        // value for statements and declarations that don't return a value.
        return code.replace(/^"use strict";/, '"use strict"; void 0;');
    }
    try {
        output = service.compile(state.input, state.path, -lines);
    }
    catch (err) {
        undo();
        throw err;
    }
    output = adjustUseStrict(output);
    // Use `diff` to check for new JavaScript to execute.
    const changes = diff_1.diffLines(state.output, output);
    if (isCompletion) {
        undo();
    }
    else {
        state.output = output;
    }
    return changes.reduce((result, change) => {
        return change.added ? exec(change.value, state.path) : result;
    }, undefined);
}
/**
 * Execute some code.
 */
function exec(code, filename) {
    const script = new vm_1.Script(code, { filename });
    return script.runInThisContext();
}
/**
 * Start a CLI REPL.
 */
function startRepl(replService, service, state, code) {
    // Eval incoming code before the REPL starts.
    if (code) {
        try {
            replService.evalCode(`${code}\n`);
        }
        catch (err) {
            replService.console.error(err);
            process.exit(1);
        }
    }
    const repl = repl_1.start({
        prompt: '> ',
        input: replService.stdin,
        output: replService.stdout,
        // Mimicking node's REPL implementation: https://github.com/nodejs/node/blob/168b22ba073ee1cbf8d0bcb4ded7ff3099335d04/lib/internal/repl.js#L28-L30
        terminal: replService.stdout.isTTY &&
            !parseInt(index_1.env.NODE_NO_READLINE, 10),
        eval: replService.nodeEval,
        useGlobal: true,
    });
    // Bookmark the point where we should reset the REPL state.
    const resetEval = appendEval(state, '');
    function reset() {
        resetEval();
        // Hard fix for TypeScript forcing `Object.defineProperty(exports, ...)`.
        exec('exports = module.exports', state.path);
    }
    reset();
    repl.on('reset', reset);
    repl.defineCommand('type', {
        help: 'Check the type of a TypeScript identifier',
        action: function (identifier) {
            if (!identifier) {
                repl.displayPrompt();
                return;
            }
            const undo = appendEval(state, identifier);
            const { name, comment } = service.getTypeInfo(state.input, state.path, state.input.length);
            undo();
            if (name)
                repl.outputStream.write(`${name}\n`);
            if (comment)
                repl.outputStream.write(`${comment}\n`);
            repl.displayPrompt();
        },
    });
    // Set up REPL history when available natively via node.js >= 11.
    if (repl.setupHistory) {
        const historyPath = index_1.env.TS_NODE_HISTORY || path_1.join(os_1.homedir(), '.ts_node_repl_history');
        repl.setupHistory(historyPath, (err) => {
            if (!err)
                return;
            replService.console.error(err);
            process.exit(1);
        });
    }
}
/**
 * Append to the eval instance and return an undo function.
 */
function appendEval(state, input) {
    const undoInput = state.input;
    const undoVersion = state.version;
    const undoOutput = state.output;
    const undoLines = state.lines;
    // Handle ASI issues with TypeScript re-evaluation.
    if (undoInput.charAt(undoInput.length - 1) === '\n' &&
        /^\s*[\/\[(`-]/.test(input) &&
        !/;\s*$/.test(undoInput)) {
        state.input = `${state.input.slice(0, -1)};\n`;
    }
    state.input += input;
    state.lines += lineCount(input);
    state.version++;
    return function () {
        state.input = undoInput;
        state.output = undoOutput;
        state.version = undoVersion;
        state.lines = undoLines;
    };
}
/**
 * Count the number of lines.
 */
function lineCount(value) {
    let count = 0;
    for (const char of value) {
        if (char === '\n') {
            count++;
        }
    }
    return count;
}
const RECOVERY_CODES = new Set([
    1003,
    1005,
    1109,
    1126,
    1160,
    1161,
    2355, // "A function whose declared type is neither 'void' nor 'any' must return a value."
]);
/**
 * Check if a function can recover gracefully.
 */
function isRecoverable(error) {
    return error.diagnosticCodes.every((code) => RECOVERY_CODES.has(code));
}
/** @internal */
function setContext(context, module, filenameAndDirname) {
    if (filenameAndDirname) {
        context.__dirname = '.';
        context.__filename = `[${filenameAndDirname}]`;
    }
    context.module = module;
    context.exports = module.exports;
    context.require = module.require.bind(module);
}
exports.setContext = setContext;
/** @internal */
function createNodeModuleForContext(type, cwd) {
    // Create a local module instance based on `cwd`.
    const module = new Module(`[${type}]`);
    module.filename = path_1.join(cwd, module.id) + '.ts';
    module.paths = Module._nodeModulePaths(cwd);
    return module;
}
exports.createNodeModuleForContext = createNodeModuleForContext;
//# sourceMappingURL=repl.js.map