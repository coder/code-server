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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _RuleTester_options;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleTester = exports.noFormat = void 0;
const path = __importStar(require("path"));
const TSESLint = __importStar(require("../ts-eslint"));
const parser = '@typescript-eslint/parser';
class RuleTester extends TSESLint.RuleTester {
    // as of eslint 6 you have to provide an absolute path to the parser
    // but that's not as clean to type, this saves us trying to manually enforce
    // that contributors require.resolve everything
    constructor(options) {
        var _a, _b;
        super(Object.assign(Object.assign({}, options), { parserOptions: Object.assign(Object.assign({}, options.parserOptions), { warnOnUnsupportedTypeScriptVersion: (_b = (_a = options.parserOptions) === null || _a === void 0 ? void 0 : _a.warnOnUnsupportedTypeScriptVersion) !== null && _b !== void 0 ? _b : false }), parser: require.resolve(options.parser) }));
        _RuleTester_options.set(this, void 0);
        __classPrivateFieldSet(this, _RuleTester_options, options, "f");
        // make sure that the parser doesn't hold onto file handles between tests
        // on linux (i.e. our CI env), there can be very a limited number of watch handles available
        afterAll(() => {
            try {
                // instead of creating a hard dependency, just use a soft require
                // a bit weird, but if they're using this tooling, it'll be installed
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                require(parser).clearCaches();
            }
            catch (_a) {
                // ignored
            }
        });
    }
    getFilename(options) {
        var _a;
        if (options) {
            const filename = `file.ts${((_a = options.ecmaFeatures) === null || _a === void 0 ? void 0 : _a.jsx) ? 'x' : ''}`;
            if (options.project) {
                return path.join(options.tsconfigRootDir != null
                    ? options.tsconfigRootDir
                    : process.cwd(), filename);
            }
            return filename;
        }
        else if (__classPrivateFieldGet(this, _RuleTester_options, "f").parserOptions) {
            return this.getFilename(__classPrivateFieldGet(this, _RuleTester_options, "f").parserOptions);
        }
        return 'file.ts';
    }
    // as of eslint 6 you have to provide an absolute path to the parser
    // If you don't do that at the test level, the test will fail somewhat cryptically...
    // This is a lot more explicit
    run(name, rule, testsReadonly) {
        const errorMessage = `Do not set the parser at the test level unless you want to use a parser other than ${parser}`;
        const tests = Object.assign({}, testsReadonly);
        // standardize the valid tests as objects
        tests.valid = tests.valid.map(test => {
            if (typeof test === 'string') {
                return {
                    code: test,
                };
            }
            return test;
        });
        tests.valid = tests.valid.map(test => {
            if (typeof test !== 'string') {
                if (test.parser === parser) {
                    throw new Error(errorMessage);
                }
                if (!test.filename) {
                    return Object.assign(Object.assign({}, test), { filename: this.getFilename(test.parserOptions) });
                }
            }
            return test;
        });
        tests.invalid = tests.invalid.map(test => {
            if (test.parser === parser) {
                throw new Error(errorMessage);
            }
            if (!test.filename) {
                return Object.assign(Object.assign({}, test), { filename: this.getFilename(test.parserOptions) });
            }
            return test;
        });
        super.run(name, rule, tests);
    }
}
exports.RuleTester = RuleTester;
_RuleTester_options = new WeakMap();
/**
 * Simple no-op tag to mark code samples as "should not format with prettier"
 *   for the internal/plugin-test-formatting lint rule
 */
function noFormat(strings, ...keys) {
    const lastIndex = strings.length - 1;
    return (strings.slice(0, lastIndex).reduce((p, s, i) => p + s + keys[i], '') +
        strings[lastIndex]);
}
exports.noFormat = noFormat;
//# sourceMappingURL=RuleTester.js.map