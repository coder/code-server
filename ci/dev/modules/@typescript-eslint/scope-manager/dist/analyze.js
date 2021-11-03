"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyze = void 0;
const visitor_keys_1 = require("@typescript-eslint/visitor-keys");
const referencer_1 = require("./referencer");
const ScopeManager_1 = require("./ScopeManager");
const lib_1 = require("./lib");
const DEFAULT_OPTIONS = {
    childVisitorKeys: visitor_keys_1.visitorKeys,
    ecmaVersion: 2018,
    globalReturn: false,
    impliedStrict: false,
    jsxPragma: 'React',
    jsxFragmentName: null,
    lib: ['es2018'],
    sourceType: 'script',
    emitDecoratorMetadata: false,
};
function mapEcmaVersion(version) {
    if (version == null || version === 3 || version === 5) {
        return 'es5';
    }
    const year = version > 2000 ? version : 2015 + (version - 6);
    const lib = `es${year}`;
    return lib in lib_1.lib ? lib : year > 2020 ? 'esnext' : 'es5';
}
/**
 * Takes an AST and returns the analyzed scopes.
 */
function analyze(tree, providedOptions) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const ecmaVersion = (_a = providedOptions === null || providedOptions === void 0 ? void 0 : providedOptions.ecmaVersion) !== null && _a !== void 0 ? _a : DEFAULT_OPTIONS.ecmaVersion;
    const options = {
        childVisitorKeys: (_b = providedOptions === null || providedOptions === void 0 ? void 0 : providedOptions.childVisitorKeys) !== null && _b !== void 0 ? _b : DEFAULT_OPTIONS.childVisitorKeys,
        ecmaVersion,
        globalReturn: (_c = providedOptions === null || providedOptions === void 0 ? void 0 : providedOptions.globalReturn) !== null && _c !== void 0 ? _c : DEFAULT_OPTIONS.globalReturn,
        impliedStrict: (_d = providedOptions === null || providedOptions === void 0 ? void 0 : providedOptions.impliedStrict) !== null && _d !== void 0 ? _d : DEFAULT_OPTIONS.impliedStrict,
        jsxPragma: (_e = providedOptions === null || providedOptions === void 0 ? void 0 : providedOptions.jsxPragma) !== null && _e !== void 0 ? _e : DEFAULT_OPTIONS.jsxPragma,
        jsxFragmentName: (_f = providedOptions === null || providedOptions === void 0 ? void 0 : providedOptions.jsxFragmentName) !== null && _f !== void 0 ? _f : DEFAULT_OPTIONS.jsxFragmentName,
        sourceType: (_g = providedOptions === null || providedOptions === void 0 ? void 0 : providedOptions.sourceType) !== null && _g !== void 0 ? _g : DEFAULT_OPTIONS.sourceType,
        lib: (_h = providedOptions === null || providedOptions === void 0 ? void 0 : providedOptions.lib) !== null && _h !== void 0 ? _h : [mapEcmaVersion(ecmaVersion)],
        emitDecoratorMetadata: (_j = providedOptions === null || providedOptions === void 0 ? void 0 : providedOptions.emitDecoratorMetadata) !== null && _j !== void 0 ? _j : DEFAULT_OPTIONS.emitDecoratorMetadata,
    };
    // ensure the option is lower cased
    options.lib = options.lib.map(l => l.toLowerCase());
    const scopeManager = new ScopeManager_1.ScopeManager(options);
    const referencer = new referencer_1.Referencer(options, scopeManager);
    referencer.visit(tree);
    return scopeManager;
}
exports.analyze = analyze;
//# sourceMappingURL=analyze.js.map