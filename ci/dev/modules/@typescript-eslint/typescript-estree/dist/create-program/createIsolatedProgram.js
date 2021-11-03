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
exports.createIsolatedProgram = void 0;
const debug_1 = __importDefault(require("debug"));
const ts = __importStar(require("typescript"));
const shared_1 = require("./shared");
const log = debug_1.default('typescript-eslint:typescript-estree:createIsolatedProgram');
/**
 * @param code The code of the file being linted
 * @returns Returns a new source file and program corresponding to the linted code
 */
function createIsolatedProgram(code, extra) {
    log('Getting isolated program in %s mode for: %s', extra.jsx ? 'TSX' : 'TS', extra.filePath);
    const compilerHost = {
        fileExists() {
            return true;
        },
        getCanonicalFileName() {
            return extra.filePath;
        },
        getCurrentDirectory() {
            return '';
        },
        getDirectories() {
            return [];
        },
        getDefaultLibFileName() {
            return 'lib.d.ts';
        },
        // TODO: Support Windows CRLF
        getNewLine() {
            return '\n';
        },
        getSourceFile(filename) {
            return ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, 
            /* setParentNodes */ true, shared_1.getScriptKind(extra, filename));
        },
        readFile() {
            return undefined;
        },
        useCaseSensitiveFileNames() {
            return true;
        },
        writeFile() {
            return null;
        },
    };
    const program = ts.createProgram([extra.filePath], Object.assign({ noResolve: true, target: ts.ScriptTarget.Latest, jsx: extra.jsx ? ts.JsxEmit.Preserve : undefined }, shared_1.createDefaultCompilerOptionsFromExtra(extra)), compilerHost);
    const ast = program.getSourceFile(extra.filePath);
    if (!ast) {
        throw new Error('Expected an ast to be returned for the single-file isolated program.');
    }
    return { ast, program };
}
exports.createIsolatedProgram = createIsolatedProgram;
//# sourceMappingURL=createIsolatedProgram.js.map