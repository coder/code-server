"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAstFromProgram = exports.getScriptKind = exports.getCanonicalFileName = exports.ensureAbsolutePath = exports.createDefaultCompilerOptionsFromExtra = exports.canonicalDirname = exports.CORE_COMPILER_OPTIONS = void 0;
const path_1 = __importDefault(require("path"));
const ts = __importStar(require("typescript"));
/**
 * Compiler options required to avoid critical functionality issues
 */
const CORE_COMPILER_OPTIONS = {
    noEmit: true,
    /**
     * Flags required to make no-unused-vars work
     */
    noUnusedLocals: true,
    noUnusedParameters: true,
};
exports.CORE_COMPILER_OPTIONS = CORE_COMPILER_OPTIONS;
/**
 * Default compiler options for program generation
 */
const DEFAULT_COMPILER_OPTIONS = Object.assign(Object.assign({}, CORE_COMPILER_OPTIONS), { allowNonTsExtensions: true, allowJs: true, checkJs: true });
function createDefaultCompilerOptionsFromExtra(extra) {
    if (extra.debugLevel.has('typescript')) {
        return Object.assign(Object.assign({}, DEFAULT_COMPILER_OPTIONS), { extendedDiagnostics: true });
    }
    return DEFAULT_COMPILER_OPTIONS;
}
exports.createDefaultCompilerOptionsFromExtra = createDefaultCompilerOptionsFromExtra;
// typescript doesn't provide a ts.sys implementation for browser environments
const useCaseSensitiveFileNames = ts.sys !== undefined ? ts.sys.useCaseSensitiveFileNames : true;
const correctPathCasing = useCaseSensitiveFileNames
    ? (filePath) => filePath
    : (filePath) => filePath.toLowerCase();
function getCanonicalFileName(filePath) {
    let normalized = path_1.default.normalize(filePath);
    if (normalized.endsWith(path_1.default.sep)) {
        normalized = normalized.substr(0, normalized.length - 1);
    }
    return correctPathCasing(normalized);
}
exports.getCanonicalFileName = getCanonicalFileName;
function ensureAbsolutePath(p, extra) {
    return path_1.default.isAbsolute(p)
        ? p
        : path_1.default.join(extra.tsconfigRootDir || process.cwd(), p);
}
exports.ensureAbsolutePath = ensureAbsolutePath;
function canonicalDirname(p) {
    return path_1.default.dirname(p);
}
exports.canonicalDirname = canonicalDirname;
function getScriptKind(extra, filePath = extra.filePath) {
    const extension = path_1.default.extname(filePath).toLowerCase();
    // note - we respect the user's extension when it is known  we could override it and force it to match their
    // jsx setting, but that could create weird situations where we throw parse errors when TSC doesn't
    switch (extension) {
        case '.ts':
            return ts.ScriptKind.TS;
        case '.tsx':
            return ts.ScriptKind.TSX;
        case '.js':
            return ts.ScriptKind.JS;
        case '.jsx':
            return ts.ScriptKind.JSX;
        case '.json':
            return ts.ScriptKind.JSON;
        default:
            // unknown extension, force typescript to ignore the file extension, and respect the user's setting
            return extra.jsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    }
}
exports.getScriptKind = getScriptKind;
function getExtension(fileName) {
    if (!fileName) {
        return null;
    }
    return fileName.endsWith('.d.ts') ? '.d.ts' : path_1.default.extname(fileName);
}
function getAstFromProgram(currentProgram, extra) {
    const ast = currentProgram.getSourceFile(extra.filePath);
    // working around https://github.com/typescript-eslint/typescript-eslint/issues/1573
    const expectedExt = getExtension(extra.filePath);
    const returnedExt = getExtension(ast === null || ast === void 0 ? void 0 : ast.fileName);
    if (expectedExt !== returnedExt) {
        return undefined;
    }
    return ast && { ast, program: currentProgram };
}
exports.getAstFromProgram = getAstFromProgram;
//# sourceMappingURL=shared.js.map