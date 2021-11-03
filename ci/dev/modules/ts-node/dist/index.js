"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.register = exports.getExtensions = exports.TSError = exports.DEFAULTS = exports.VERSION = exports.debug = exports.INSPECT_CUSTOM = exports.env = exports.REGISTER_INSTANCE = exports.createRepl = void 0;
const path_1 = require("path");
const module_1 = require("module");
const util = require("util");
const url_1 = require("url");
const sourceMapSupport = require("source-map-support");
const make_error_1 = require("make-error");
const util_1 = require("./util");
const configuration_1 = require("./configuration");
const module_type_classifier_1 = require("./module-type-classifier");
const resolver_functions_1 = require("./resolver-functions");
var repl_1 = require("./repl");
Object.defineProperty(exports, "createRepl", { enumerable: true, get: function () { return repl_1.createRepl; } });
/**
 * Does this version of node obey the package.json "type" field
 * and throw ERR_REQUIRE_ESM when attempting to require() an ESM modules.
 */
const engineSupportsPackageTypeField = parseInt(process.versions.node.split('.')[0], 10) >= 12;
/**
 * Assert that script can be loaded as CommonJS when we attempt to require it.
 * If it should be loaded as ESM, throw ERR_REQUIRE_ESM like node does.
 *
 * Loaded conditionally so we don't need to support older node versions
 */
let assertScriptCanLoadAsCJS = engineSupportsPackageTypeField
    ? require('../dist-raw/node-cjs-loader-utils').assertScriptCanLoadAsCJSImpl
    : () => {
        /* noop */
    };
/**
 * Registered `ts-node` instance information.
 */
exports.REGISTER_INSTANCE = Symbol.for('ts-node.register.instance');
/** @internal */
exports.env = process.env;
/**
 * @internal
 */
exports.INSPECT_CUSTOM = util.inspect.custom || 'inspect';
/**
 * Debugging `ts-node`.
 */
const shouldDebug = util_1.yn(exports.env.TS_NODE_DEBUG);
/** @internal */
exports.debug = shouldDebug
    ? (...args) => console.log(`[ts-node ${new Date().toISOString()}]`, ...args)
    : () => undefined;
const debugFn = shouldDebug
    ? (key, fn) => {
        let i = 0;
        return (x) => {
            exports.debug(key, x, ++i);
            return fn(x);
        };
    }
    : (_, fn) => fn;
/**
 * Export the current version.
 */
exports.VERSION = require('../package.json').version;
/**
 * Default register options, including values specified via environment
 * variables.
 * @internal
 */
exports.DEFAULTS = {
    cwd: (_a = exports.env.TS_NODE_CWD) !== null && _a !== void 0 ? _a : exports.env.TS_NODE_DIR,
    emit: util_1.yn(exports.env.TS_NODE_EMIT),
    scope: util_1.yn(exports.env.TS_NODE_SCOPE),
    scopeDir: exports.env.TS_NODE_SCOPE_DIR,
    files: util_1.yn(exports.env.TS_NODE_FILES),
    pretty: util_1.yn(exports.env.TS_NODE_PRETTY),
    compiler: exports.env.TS_NODE_COMPILER,
    compilerOptions: util_1.parse(exports.env.TS_NODE_COMPILER_OPTIONS),
    ignore: util_1.split(exports.env.TS_NODE_IGNORE),
    project: exports.env.TS_NODE_PROJECT,
    skipProject: util_1.yn(exports.env.TS_NODE_SKIP_PROJECT),
    skipIgnore: util_1.yn(exports.env.TS_NODE_SKIP_IGNORE),
    preferTsExts: util_1.yn(exports.env.TS_NODE_PREFER_TS_EXTS),
    ignoreDiagnostics: util_1.split(exports.env.TS_NODE_IGNORE_DIAGNOSTICS),
    transpileOnly: util_1.yn(exports.env.TS_NODE_TRANSPILE_ONLY),
    typeCheck: util_1.yn(exports.env.TS_NODE_TYPE_CHECK),
    compilerHost: util_1.yn(exports.env.TS_NODE_COMPILER_HOST),
    logError: util_1.yn(exports.env.TS_NODE_LOG_ERROR),
    experimentalEsmLoader: false,
};
/**
 * TypeScript diagnostics error.
 */
class TSError extends make_error_1.BaseError {
    constructor(diagnosticText, diagnosticCodes) {
        super(`⨯ Unable to compile TypeScript:\n${diagnosticText}`);
        this.diagnosticText = diagnosticText;
        this.diagnosticCodes = diagnosticCodes;
        this.name = 'TSError';
    }
    /**
     * @internal
     */
    [exports.INSPECT_CUSTOM]() {
        return this.diagnosticText;
    }
}
exports.TSError = TSError;
/** @internal */
function getExtensions(config) {
    const tsExtensions = ['.ts'];
    const jsExtensions = [];
    // Enable additional extensions when JSX or `allowJs` is enabled.
    if (config.options.jsx)
        tsExtensions.push('.tsx');
    if (config.options.allowJs)
        jsExtensions.push('.js');
    if (config.options.jsx && config.options.allowJs)
        jsExtensions.push('.jsx');
    return { tsExtensions, jsExtensions };
}
exports.getExtensions = getExtensions;
/**
 * Register TypeScript compiler instance onto node.js
 */
function register(opts = {}) {
    const originalJsHandler = require.extensions['.js'];
    const service = create(opts);
    const { tsExtensions, jsExtensions } = getExtensions(service.config);
    const extensions = [...tsExtensions, ...jsExtensions];
    // Expose registered instance globally.
    process[exports.REGISTER_INSTANCE] = service;
    // Register the extensions.
    registerExtensions(service.options.preferTsExts, extensions, service, originalJsHandler);
    // Require specified modules before start-up.
    module_1.Module._preloadModules(service.options.require);
    return service;
}
exports.register = register;
/**
 * Create TypeScript compiler instance.
 */
function create(rawOptions = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const cwd = path_1.resolve((_c = (_b = (_a = rawOptions.cwd) !== null && _a !== void 0 ? _a : rawOptions.dir) !== null && _b !== void 0 ? _b : exports.DEFAULTS.cwd) !== null && _c !== void 0 ? _c : process.cwd());
    const compilerName = (_d = rawOptions.compiler) !== null && _d !== void 0 ? _d : exports.DEFAULTS.compiler;
    /**
     * Load the typescript compiler. It is required to load the tsconfig but might
     * be changed by the tsconfig, so we have to do this twice.
     */
    function loadCompiler(name, relativeToPath) {
        const compiler = require.resolve(name || 'typescript', {
            paths: [relativeToPath, __dirname],
        });
        const ts = require(compiler);
        return { compiler, ts };
    }
    // Compute minimum options to read the config file.
    let { compiler, ts } = loadCompiler(compilerName, (_f = (_e = rawOptions.projectSearchDir) !== null && _e !== void 0 ? _e : rawOptions.project) !== null && _f !== void 0 ? _f : cwd);
    // Read config file and merge new options between env and CLI options.
    const { configFilePath, config, tsNodeOptionsFromTsconfig, optionBasePaths, } = configuration_1.readConfig(cwd, ts, rawOptions);
    const options = util_1.assign({}, exports.DEFAULTS, tsNodeOptionsFromTsconfig || {}, { optionBasePaths }, rawOptions);
    options.require = [
        ...(tsNodeOptionsFromTsconfig.require || []),
        ...(rawOptions.require || []),
    ];
    // Re-load the compiler in case it has changed.
    // Compiler is loaded relative to tsconfig.json, so tsconfig discovery may cause us to load a
    // different compiler than we did above, even if the name has not changed.
    if (configFilePath) {
        ({ compiler, ts } = loadCompiler(options.compiler, configFilePath));
    }
    const readFile = options.readFile || ts.sys.readFile;
    const fileExists = options.fileExists || ts.sys.fileExists;
    // typeCheck can override transpileOnly, useful for CLI flag to override config file
    const transpileOnly = options.transpileOnly === true && options.typeCheck !== true;
    const transformers = options.transformers || undefined;
    const ignoreDiagnostics = [
        6059,
        18002,
        18003,
        ...(options.ignoreDiagnostics || []),
    ].map(Number);
    const configDiagnosticList = filterDiagnostics(config.errors, ignoreDiagnostics);
    const outputCache = new Map();
    const configFileDirname = configFilePath ? path_1.dirname(configFilePath) : null;
    const scopeDir = (_j = (_h = (_g = options.scopeDir) !== null && _g !== void 0 ? _g : config.options.rootDir) !== null && _h !== void 0 ? _h : configFileDirname) !== null && _j !== void 0 ? _j : cwd;
    const ignoreBaseDir = configFileDirname !== null && configFileDirname !== void 0 ? configFileDirname : cwd;
    const isScoped = options.scope
        ? (fileName) => path_1.relative(scopeDir, fileName).charAt(0) !== '.'
        : () => true;
    const shouldIgnore = createIgnore(ignoreBaseDir, options.skipIgnore
        ? []
        : (options.ignore || ['(?:^|/)node_modules/']).map((str) => new RegExp(str)));
    const diagnosticHost = {
        getNewLine: () => ts.sys.newLine,
        getCurrentDirectory: () => cwd,
        getCanonicalFileName: ts.sys.useCaseSensitiveFileNames
            ? (x) => x
            : (x) => x.toLowerCase(),
    };
    if (options.transpileOnly && typeof transformers === 'function') {
        throw new TypeError('Transformers function is unavailable in "--transpile-only"');
    }
    let customTranspiler = undefined;
    if (options.transpiler) {
        if (!transpileOnly)
            throw new Error('Custom transpiler can only be used when transpileOnly is enabled.');
        const transpilerName = typeof options.transpiler === 'string'
            ? options.transpiler
            : options.transpiler[0];
        const transpilerOptions = typeof options.transpiler === 'string' ? {} : (_k = options.transpiler[1]) !== null && _k !== void 0 ? _k : {};
        // TODO mimic fixed resolution logic from loadCompiler main
        // TODO refactor into a more generic "resolve dep relative to project" helper
        const transpilerPath = require.resolve(transpilerName, {
            paths: [cwd, __dirname],
        });
        const transpilerFactory = require(transpilerPath).create;
        customTranspiler = transpilerFactory(Object.assign({ service: { options, config } }, transpilerOptions));
    }
    // Install source map support and read from memory cache.
    sourceMapSupport.install({
        environment: 'node',
        retrieveFile(pathOrUrl) {
            var _a;
            let path = pathOrUrl;
            // If it's a file URL, convert to local path
            // Note: fileURLToPath does not exist on early node v10
            // I could not find a way to handle non-URLs except to swallow an error
            if (options.experimentalEsmLoader && path.startsWith('file://')) {
                try {
                    path = url_1.fileURLToPath(path);
                }
                catch (e) {
                    /* swallow error */
                }
            }
            path = util_1.normalizeSlashes(path);
            return ((_a = outputCache.get(path)) === null || _a === void 0 ? void 0 : _a.content) || '';
        },
    });
    const formatDiagnostics = process.stdout.isTTY || options.pretty
        ? ts.formatDiagnosticsWithColorAndContext || ts.formatDiagnostics
        : ts.formatDiagnostics;
    function createTSError(diagnostics) {
        const diagnosticText = formatDiagnostics(diagnostics, diagnosticHost);
        const diagnosticCodes = diagnostics.map((x) => x.code);
        return new TSError(diagnosticText, diagnosticCodes);
    }
    function reportTSError(configDiagnosticList) {
        const error = createTSError(configDiagnosticList);
        if (options.logError) {
            // Print error in red color and continue execution.
            console.error('\x1b[31m%s\x1b[0m', error);
        }
        else {
            // Throw error and exit the script.
            throw error;
        }
    }
    // Render the configuration errors.
    if (configDiagnosticList.length)
        reportTSError(configDiagnosticList);
    /**
     * Get the extension for a transpiled file.
     */
    const getExtension = config.options.jsx === ts.JsxEmit.Preserve
        ? (path) => (/\.[tj]sx$/.test(path) ? '.jsx' : '.js')
        : (_) => '.js';
    /**
     * Create the basic required function using transpile mode.
     */
    let getOutput;
    let getTypeInfo;
    const getCanonicalFileName = ts.createGetCanonicalFileName(ts.sys.useCaseSensitiveFileNames);
    const moduleTypeClassifier = module_type_classifier_1.createModuleTypeClassifier({
        basePath: (_l = options.optionBasePaths) === null || _l === void 0 ? void 0 : _l.moduleTypes,
        patterns: options.moduleTypes,
    });
    // Use full language services when the fast option is disabled.
    if (!transpileOnly) {
        const fileContents = new Map();
        const rootFileNames = new Set(config.fileNames);
        const cachedReadFile = util_1.cachedLookup(debugFn('readFile', readFile));
        // Use language services by default (TODO: invert next major version).
        if (!options.compilerHost) {
            let projectVersion = 1;
            const fileVersions = new Map(Array.from(rootFileNames).map((fileName) => [fileName, 0]));
            const getCustomTransformers = () => {
                if (typeof transformers === 'function') {
                    const program = service.getProgram();
                    return program ? transformers(program) : undefined;
                }
                return transformers;
            };
            // Create the compiler host for type checking.
            const serviceHost = {
                getProjectVersion: () => String(projectVersion),
                getScriptFileNames: () => Array.from(rootFileNames),
                getScriptVersion: (fileName) => {
                    const version = fileVersions.get(fileName);
                    return version ? version.toString() : '';
                },
                getScriptSnapshot(fileName) {
                    // TODO ordering of this with getScriptVersion?  Should they sync up?
                    let contents = fileContents.get(fileName);
                    // Read contents into TypeScript memory cache.
                    if (contents === undefined) {
                        contents = cachedReadFile(fileName);
                        if (contents === undefined)
                            return;
                        fileVersions.set(fileName, 1);
                        fileContents.set(fileName, contents);
                        projectVersion++;
                    }
                    return ts.ScriptSnapshot.fromString(contents);
                },
                readFile: cachedReadFile,
                readDirectory: ts.sys.readDirectory,
                getDirectories: util_1.cachedLookup(debugFn('getDirectories', ts.sys.getDirectories)),
                fileExists: util_1.cachedLookup(debugFn('fileExists', fileExists)),
                directoryExists: util_1.cachedLookup(debugFn('directoryExists', ts.sys.directoryExists)),
                realpath: ts.sys.realpath
                    ? util_1.cachedLookup(debugFn('realpath', ts.sys.realpath))
                    : undefined,
                getNewLine: () => ts.sys.newLine,
                useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
                getCurrentDirectory: () => cwd,
                getCompilationSettings: () => config.options,
                getDefaultLibFileName: () => ts.getDefaultLibFilePath(config.options),
                getCustomTransformers: getCustomTransformers,
            };
            const { resolveModuleNames, getResolvedModuleWithFailedLookupLocationsFromCache, resolveTypeReferenceDirectives, isFileKnownToBeInternal, markBucketOfFilenameInternal, } = resolver_functions_1.createResolverFunctions({
                serviceHost,
                getCanonicalFileName,
                ts,
                cwd,
                config,
                configFilePath,
            });
            serviceHost.resolveModuleNames = resolveModuleNames;
            serviceHost.getResolvedModuleWithFailedLookupLocationsFromCache = getResolvedModuleWithFailedLookupLocationsFromCache;
            serviceHost.resolveTypeReferenceDirectives = resolveTypeReferenceDirectives;
            const registry = ts.createDocumentRegistry(ts.sys.useCaseSensitiveFileNames, cwd);
            const service = ts.createLanguageService(serviceHost, registry);
            const updateMemoryCache = (contents, fileName) => {
                // Add to `rootFiles` as necessary, either to make TS include a file it has not seen,
                // or to trigger a re-classification of files from external to internal.
                if (!rootFileNames.has(fileName) &&
                    !isFileKnownToBeInternal(fileName)) {
                    markBucketOfFilenameInternal(fileName);
                    rootFileNames.add(fileName);
                    // Increment project version for every change to rootFileNames.
                    projectVersion++;
                }
                const previousVersion = fileVersions.get(fileName) || 0;
                const previousContents = fileContents.get(fileName);
                // Avoid incrementing cache when nothing has changed.
                if (contents !== previousContents) {
                    fileVersions.set(fileName, previousVersion + 1);
                    fileContents.set(fileName, contents);
                    // Increment project version for every file change.
                    projectVersion++;
                }
            };
            let previousProgram = undefined;
            getOutput = (code, fileName) => {
                updateMemoryCache(code, fileName);
                const programBefore = service.getProgram();
                if (programBefore !== previousProgram) {
                    exports.debug(`compiler rebuilt Program instance when getting output for ${fileName}`);
                }
                const output = service.getEmitOutput(fileName);
                // Get the relevant diagnostics - this is 3x faster than `getPreEmitDiagnostics`.
                const diagnostics = service
                    .getSemanticDiagnostics(fileName)
                    .concat(service.getSyntacticDiagnostics(fileName));
                const programAfter = service.getProgram();
                exports.debug('invariant: Is service.getProject() identical before and after getting emit output and diagnostics? (should always be true) ', programBefore === programAfter);
                previousProgram = programAfter;
                const diagnosticList = filterDiagnostics(diagnostics, ignoreDiagnostics);
                if (diagnosticList.length)
                    reportTSError(diagnosticList);
                if (output.emitSkipped) {
                    throw new TypeError(`${path_1.relative(cwd, fileName)}: Emit skipped`);
                }
                // Throw an error when requiring `.d.ts` files.
                if (output.outputFiles.length === 0) {
                    throw new TypeError(`Unable to require file: ${path_1.relative(cwd, fileName)}\n` +
                        'This is usually the result of a faulty configuration or import. ' +
                        'Make sure there is a `.js`, `.json` or other executable extension with ' +
                        'loader attached before `ts-node` available.');
                }
                return [output.outputFiles[1].text, output.outputFiles[0].text];
            };
            getTypeInfo = (code, fileName, position) => {
                updateMemoryCache(code, fileName);
                const info = service.getQuickInfoAtPosition(fileName, position);
                const name = ts.displayPartsToString(info ? info.displayParts : []);
                const comment = ts.displayPartsToString(info ? info.documentation : []);
                return { name, comment };
            };
        }
        else {
            const sys = Object.assign(Object.assign(Object.assign({}, ts.sys), diagnosticHost), { readFile: (fileName) => {
                    const cacheContents = fileContents.get(fileName);
                    if (cacheContents !== undefined)
                        return cacheContents;
                    const contents = cachedReadFile(fileName);
                    if (contents)
                        fileContents.set(fileName, contents);
                    return contents;
                }, readDirectory: ts.sys.readDirectory, getDirectories: util_1.cachedLookup(debugFn('getDirectories', ts.sys.getDirectories)), fileExists: util_1.cachedLookup(debugFn('fileExists', fileExists)), directoryExists: util_1.cachedLookup(debugFn('directoryExists', ts.sys.directoryExists)), resolvePath: util_1.cachedLookup(debugFn('resolvePath', ts.sys.resolvePath)), realpath: ts.sys.realpath
                    ? util_1.cachedLookup(debugFn('realpath', ts.sys.realpath))
                    : undefined });
            const host = ts.createIncrementalCompilerHost
                ? ts.createIncrementalCompilerHost(config.options, sys)
                : Object.assign(Object.assign({}, sys), { getSourceFile: (fileName, languageVersion) => {
                        const contents = sys.readFile(fileName);
                        if (contents === undefined)
                            return;
                        return ts.createSourceFile(fileName, contents, languageVersion);
                    }, getDefaultLibLocation: () => util_1.normalizeSlashes(path_1.dirname(compiler)), getDefaultLibFileName: () => util_1.normalizeSlashes(path_1.join(path_1.dirname(compiler), ts.getDefaultLibFileName(config.options))), useCaseSensitiveFileNames: () => sys.useCaseSensitiveFileNames });
            const { resolveModuleNames, resolveTypeReferenceDirectives, isFileKnownToBeInternal, markBucketOfFilenameInternal, } = resolver_functions_1.createResolverFunctions({
                serviceHost: host,
                cwd,
                configFilePath,
                config,
                ts,
                getCanonicalFileName,
            });
            host.resolveModuleNames = resolveModuleNames;
            host.resolveTypeReferenceDirectives = resolveTypeReferenceDirectives;
            // Fallback for older TypeScript releases without incremental API.
            let builderProgram = ts.createIncrementalProgram
                ? ts.createIncrementalProgram({
                    rootNames: Array.from(rootFileNames),
                    options: config.options,
                    host: host,
                    configFileParsingDiagnostics: config.errors,
                    projectReferences: config.projectReferences,
                })
                : ts.createEmitAndSemanticDiagnosticsBuilderProgram(Array.from(rootFileNames), config.options, host, undefined, config.errors, config.projectReferences);
            // Read and cache custom transformers.
            const customTransformers = typeof transformers === 'function'
                ? transformers(builderProgram.getProgram())
                : transformers;
            // Set the file contents into cache manually.
            const updateMemoryCache = (contents, fileName) => {
                const previousContents = fileContents.get(fileName);
                const contentsChanged = previousContents !== contents;
                if (contentsChanged) {
                    fileContents.set(fileName, contents);
                }
                // Add to `rootFiles` when discovered by compiler for the first time.
                let addedToRootFileNames = false;
                if (!rootFileNames.has(fileName) &&
                    !isFileKnownToBeInternal(fileName)) {
                    markBucketOfFilenameInternal(fileName);
                    rootFileNames.add(fileName);
                    addedToRootFileNames = true;
                }
                // Update program when file changes.
                if (addedToRootFileNames || contentsChanged) {
                    builderProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram(Array.from(rootFileNames), config.options, host, builderProgram, config.errors, config.projectReferences);
                }
            };
            getOutput = (code, fileName) => {
                const output = ['', ''];
                updateMemoryCache(code, fileName);
                const sourceFile = builderProgram.getSourceFile(fileName);
                if (!sourceFile)
                    throw new TypeError(`Unable to read file: ${fileName}`);
                const program = builderProgram.getProgram();
                const diagnostics = ts.getPreEmitDiagnostics(program, sourceFile);
                const diagnosticList = filterDiagnostics(diagnostics, ignoreDiagnostics);
                if (diagnosticList.length)
                    reportTSError(diagnosticList);
                const result = builderProgram.emit(sourceFile, (path, file, writeByteOrderMark) => {
                    if (path.endsWith('.map')) {
                        output[1] = file;
                    }
                    else {
                        output[0] = file;
                    }
                    if (options.emit)
                        sys.writeFile(path, file, writeByteOrderMark);
                }, undefined, undefined, customTransformers);
                if (result.emitSkipped) {
                    throw new TypeError(`${path_1.relative(cwd, fileName)}: Emit skipped`);
                }
                // Throw an error when requiring files that cannot be compiled.
                if (output[0] === '') {
                    if (program.isSourceFileFromExternalLibrary(sourceFile)) {
                        throw new TypeError(`Unable to compile file from external library: ${path_1.relative(cwd, fileName)}`);
                    }
                    throw new TypeError(`Unable to require file: ${path_1.relative(cwd, fileName)}\n` +
                        'This is usually the result of a faulty configuration or import. ' +
                        'Make sure there is a `.js`, `.json` or other executable extension with ' +
                        'loader attached before `ts-node` available.');
                }
                return output;
            };
            getTypeInfo = (code, fileName, position) => {
                updateMemoryCache(code, fileName);
                const sourceFile = builderProgram.getSourceFile(fileName);
                if (!sourceFile)
                    throw new TypeError(`Unable to read file: ${fileName}`);
                const node = getTokenAtPosition(ts, sourceFile, position);
                const checker = builderProgram.getProgram().getTypeChecker();
                const symbol = checker.getSymbolAtLocation(node);
                if (!symbol)
                    return { name: '', comment: '' };
                const type = checker.getTypeOfSymbolAtLocation(symbol, node);
                const signatures = [
                    ...type.getConstructSignatures(),
                    ...type.getCallSignatures(),
                ];
                return {
                    name: signatures.length
                        ? signatures.map((x) => checker.signatureToString(x)).join('\n')
                        : checker.typeToString(type),
                    comment: ts.displayPartsToString(symbol ? symbol.getDocumentationComment(checker) : []),
                };
            };
            // Write `.tsbuildinfo` when `--build` is enabled.
            if (options.emit && config.options.incremental) {
                process.on('exit', () => {
                    // Emits `.tsbuildinfo` to filesystem.
                    builderProgram.getProgram().emitBuildInfo();
                });
            }
        }
    }
    else {
        getOutput = createTranspileOnlyGetOutputFunction();
        getTypeInfo = () => {
            throw new TypeError('Type information is unavailable in "--transpile-only"');
        };
    }
    function createTranspileOnlyGetOutputFunction(overrideModuleType) {
        const compilerOptions = Object.assign({}, config.options);
        if (overrideModuleType !== undefined)
            compilerOptions.module = overrideModuleType;
        return (code, fileName) => {
            let result;
            if (customTranspiler) {
                result = customTranspiler.transpile(code, {
                    fileName,
                });
            }
            else {
                result = ts.transpileModule(code, {
                    fileName,
                    compilerOptions,
                    reportDiagnostics: true,
                    transformers: transformers,
                });
            }
            const diagnosticList = filterDiagnostics(result.diagnostics || [], ignoreDiagnostics);
            if (diagnosticList.length)
                reportTSError(diagnosticList);
            return [result.outputText, result.sourceMapText];
        };
    }
    // When either is undefined, it means normal `getOutput` should be used
    const getOutputForceCommonJS = config.options.module === ts.ModuleKind.CommonJS
        ? undefined
        : createTranspileOnlyGetOutputFunction(ts.ModuleKind.CommonJS);
    const getOutputForceESM = config.options.module === ts.ModuleKind.ES2015 ||
        config.options.module === ts.ModuleKind.ES2020 ||
        config.options.module === ts.ModuleKind.ESNext
        ? undefined
        : createTranspileOnlyGetOutputFunction(ts.ModuleKind.ES2020 || ts.ModuleKind.ES2015);
    // Create a simple TypeScript compiler proxy.
    function compile(code, fileName, lineOffset = 0) {
        const normalizedFileName = util_1.normalizeSlashes(fileName);
        const classification = moduleTypeClassifier.classifyModule(normalizedFileName);
        // Must always call normal getOutput to throw typechecking errors
        let [value, sourceMap] = getOutput(code, normalizedFileName);
        // If module classification contradicts the above, call the relevant transpiler
        if (classification.moduleType === 'cjs' && getOutputForceCommonJS) {
            [value, sourceMap] = getOutputForceCommonJS(code, normalizedFileName);
        }
        else if (classification.moduleType === 'esm' && getOutputForceESM) {
            [value, sourceMap] = getOutputForceESM(code, normalizedFileName);
        }
        const output = updateOutput(value, normalizedFileName, sourceMap, getExtension);
        outputCache.set(normalizedFileName, { content: output });
        return output;
    }
    let active = true;
    const enabled = (enabled) => enabled === undefined ? active : (active = !!enabled);
    const extensions = getExtensions(config);
    const ignored = (fileName) => {
        if (!active)
            return true;
        const ext = path_1.extname(fileName);
        if (extensions.tsExtensions.includes(ext) ||
            extensions.jsExtensions.includes(ext)) {
            return !isScoped(fileName) || shouldIgnore(fileName);
        }
        return true;
    };
    return {
        ts,
        config,
        compile,
        getTypeInfo,
        ignored,
        enabled,
        options,
        configFilePath,
        moduleTypeClassifier,
    };
}
exports.create = create;
/**
 * Check if the filename should be ignored.
 */
function createIgnore(ignoreBaseDir, ignore) {
    return (fileName) => {
        const relname = path_1.relative(ignoreBaseDir, fileName);
        const path = util_1.normalizeSlashes(relname);
        return ignore.some((x) => x.test(path));
    };
}
/**
 * "Refreshes" an extension on `require.extensions`.
 *
 * @param {string} ext
 */
function reorderRequireExtension(ext) {
    const old = require.extensions[ext];
    delete require.extensions[ext];
    require.extensions[ext] = old;
}
/**
 * Register the extensions to support when importing files.
 */
function registerExtensions(preferTsExts, extensions, service, originalJsHandler) {
    // Register new extensions.
    for (const ext of extensions) {
        registerExtension(ext, service, originalJsHandler);
    }
    if (preferTsExts) {
        const preferredExtensions = new Set([
            ...extensions,
            ...Object.keys(require.extensions),
        ]);
        for (const ext of preferredExtensions)
            reorderRequireExtension(ext);
    }
}
/**
 * Register the extension for node.
 */
function registerExtension(ext, service, originalHandler) {
    const old = require.extensions[ext] || originalHandler;
    require.extensions[ext] = function (m, filename) {
        if (service.ignored(filename))
            return old(m, filename);
        assertScriptCanLoadAsCJS(service, m, filename);
        const _compile = m._compile;
        m._compile = function (code, fileName) {
            exports.debug('module._compile', fileName);
            const result = service.compile(code, fileName);
            return _compile.call(this, result, fileName);
        };
        return old(m, filename);
    };
}
/**
 * Update the output remapping the source map.
 */
function updateOutput(outputText, fileName, sourceMap, getExtension) {
    const base64Map = Buffer.from(updateSourceMap(sourceMap, fileName), 'utf8').toString('base64');
    const sourceMapContent = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${base64Map}`;
    // Expected form: `//# sourceMappingURL=foo bar.js.map` or `//# sourceMappingURL=foo%20bar.js.map` for input file "foo bar.tsx"
    // Percent-encoding behavior added in TS 4.1.1: https://github.com/microsoft/TypeScript/issues/40951
    const prefix = '//# sourceMappingURL=';
    const prefixLength = prefix.length;
    const baseName = /*foo.tsx*/ path_1.basename(fileName);
    const extName = /*.tsx*/ path_1.extname(fileName);
    const extension = /*.js*/ getExtension(fileName);
    const sourcemapFilename = baseName.slice(0, -extName.length) + extension + '.map';
    const sourceMapLengthWithoutPercentEncoding = prefixLength + sourcemapFilename.length;
    /*
     * Only rewrite if existing directive exists at the location we expect, to support:
     *   a) compilers that do not append a sourcemap directive
     *   b) situations where we did the math wrong
     *     Not ideal, but appending our sourcemap *after* a pre-existing sourcemap still overrides, so the end-user is happy.
     */
    if (outputText.substr(-sourceMapLengthWithoutPercentEncoding, prefixLength) ===
        prefix) {
        return (outputText.slice(0, -sourceMapLengthWithoutPercentEncoding) +
            sourceMapContent);
    }
    // If anyone asks why we're not using URL, the URL equivalent is: `u = new URL('http://d'); u.pathname = "/" + sourcemapFilename; return u.pathname.slice(1);
    const sourceMapLengthWithPercentEncoding = prefixLength + encodeURI(sourcemapFilename).length;
    if (outputText.substr(-sourceMapLengthWithPercentEncoding, prefixLength) ===
        prefix) {
        return (outputText.slice(0, -sourceMapLengthWithPercentEncoding) +
            sourceMapContent);
    }
    return `${outputText}\n${sourceMapContent}`;
}
/**
 * Update the source map contents for improved output.
 */
function updateSourceMap(sourceMapText, fileName) {
    const sourceMap = JSON.parse(sourceMapText);
    sourceMap.file = fileName;
    sourceMap.sources = [fileName];
    delete sourceMap.sourceRoot;
    return JSON.stringify(sourceMap);
}
/**
 * Filter diagnostics.
 */
function filterDiagnostics(diagnostics, ignore) {
    return diagnostics.filter((x) => ignore.indexOf(x.code) === -1);
}
/**
 * Get token at file position.
 *
 * Reference: https://github.com/microsoft/TypeScript/blob/fcd9334f57d85b73dd66ad2d21c02e84822f4841/src/services/utilities.ts#L705-L731
 */
function getTokenAtPosition(ts, sourceFile, position) {
    let current = sourceFile;
    outer: while (true) {
        for (const child of current.getChildren(sourceFile)) {
            const start = child.getFullStart();
            if (start > position)
                break;
            const end = child.getEnd();
            if (position <= end) {
                current = child;
                continue outer;
            }
        }
        return current;
    }
}
//# sourceMappingURL=index.js.map