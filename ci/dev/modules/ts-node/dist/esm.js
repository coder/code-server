"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAndCreateEsmHooks = void 0;
const index_1 = require("./index");
const url_1 = require("url");
const path_1 = require("path");
const assert = require("assert");
const util_1 = require("./util");
const { createResolve, } = require('../dist-raw/node-esm-resolve-implementation');
// Note: On Windows, URLs look like this: file:///D:/dev/@TypeStrong/ts-node-examples/foo.ts
function registerAndCreateEsmHooks(opts) {
    // Automatically performs registration just like `-r ts-node/register`
    const tsNodeInstance = index_1.register(Object.assign(Object.assign({}, opts), { experimentalEsmLoader: true }));
    // Custom implementation that considers additional file extensions and automatically adds file extensions
    const nodeResolveImplementation = createResolve(Object.assign(Object.assign({}, index_1.getExtensions(tsNodeInstance.config)), { preferTsExts: tsNodeInstance.options.preferTsExts }));
    return { resolve, getFormat, transformSource };
    function isFileUrlOrNodeStyleSpecifier(parsed) {
        // We only understand file:// URLs, but in node, the specifier can be a node-style `./foo` or `foo`
        const { protocol } = parsed;
        return protocol === null || protocol === 'file:';
    }
    function resolve(specifier, context, defaultResolve) {
        return __awaiter(this, void 0, void 0, function* () {
            const defer = () => __awaiter(this, void 0, void 0, function* () {
                const r = yield defaultResolve(specifier, context, defaultResolve);
                return r;
            });
            const parsed = url_1.parse(specifier);
            const { pathname, protocol, hostname } = parsed;
            if (!isFileUrlOrNodeStyleSpecifier(parsed)) {
                return defer();
            }
            if (protocol !== null && protocol !== 'file:') {
                return defer();
            }
            // Malformed file:// URL?  We should always see `null` or `''`
            if (hostname) {
                // TODO file://./foo sets `hostname` to `'.'`.  Perhaps we should special-case this.
                return defer();
            }
            // pathname is the path to be resolved
            return nodeResolveImplementation.defaultResolve(specifier, context, defaultResolve);
        });
    }
    function getFormat(url, context, defaultGetFormat) {
        return __awaiter(this, void 0, void 0, function* () {
            const defer = (overrideUrl = url) => defaultGetFormat(overrideUrl, context, defaultGetFormat);
            const parsed = url_1.parse(url);
            if (!isFileUrlOrNodeStyleSpecifier(parsed)) {
                return defer();
            }
            const { pathname } = parsed;
            assert(pathname !== null, 'ESM getFormat() hook: URL should never have null pathname');
            const nativePath = url_1.fileURLToPath(url);
            // If file has .ts, .tsx, or .jsx extension, then ask node how it would treat this file if it were .js
            const ext = path_1.extname(nativePath);
            let nodeSays;
            if (ext !== '.js' && !tsNodeInstance.ignored(nativePath)) {
                nodeSays = yield defer(url_1.format(url_1.pathToFileURL(nativePath + '.js')));
            }
            else {
                nodeSays = yield defer();
            }
            // For files compiled by ts-node that node believes are either CJS or ESM, check if we should override that classification
            if (!tsNodeInstance.ignored(nativePath) &&
                (nodeSays.format === 'commonjs' || nodeSays.format === 'module')) {
                const { moduleType } = tsNodeInstance.moduleTypeClassifier.classifyModule(util_1.normalizeSlashes(nativePath));
                if (moduleType === 'cjs') {
                    return { format: 'commonjs' };
                }
                else if (moduleType === 'esm') {
                    return { format: 'module' };
                }
            }
            return nodeSays;
        });
    }
    function transformSource(source, context, defaultTransformSource) {
        return __awaiter(this, void 0, void 0, function* () {
            const defer = () => defaultTransformSource(source, context, defaultTransformSource);
            const sourceAsString = typeof source === 'string' ? source : source.toString('utf8');
            const { url } = context;
            const parsed = url_1.parse(url);
            if (!isFileUrlOrNodeStyleSpecifier(parsed)) {
                return defer();
            }
            const nativePath = url_1.fileURLToPath(url);
            if (tsNodeInstance.ignored(nativePath)) {
                return defer();
            }
            const emittedJs = tsNodeInstance.compile(sourceAsString, nativePath);
            return { source: emittedJs };
        });
    }
}
exports.registerAndCreateEsmHooks = registerAndCreateEsmHooks;
//# sourceMappingURL=esm.js.map