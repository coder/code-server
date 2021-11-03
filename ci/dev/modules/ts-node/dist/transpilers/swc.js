"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
function create(createOptions) {
    const { swc, service: { config }, } = createOptions;
    // Load swc compiler
    let swcInstance;
    if (typeof swc === 'string') {
        swcInstance = require(swc);
    }
    else if (swc == null) {
        let swcResolved;
        try {
            swcResolved = require.resolve('@swc/core');
        }
        catch (e) {
            try {
                swcResolved = require.resolve('@swc/wasm');
            }
            catch (e) {
                throw new Error('swc compiler requires either @swc/core or @swc/wasm to be installed as dependencies');
            }
        }
        swcInstance = require(swcResolved);
    }
    else {
        swcInstance = swc;
    }
    // Prepare SWC options derived from typescript compiler options
    const compilerOptions = config.options;
    const { esModuleInterop, sourceMap, importHelpers, experimentalDecorators, emitDecoratorMetadata, target, jsxFactory, jsxFragmentFactory, } = compilerOptions;
    const nonTsxOptions = createSwcOptions(false);
    const tsxOptions = createSwcOptions(true);
    function createSwcOptions(isTsx) {
        var _a;
        const swcTarget = (_a = targetMapping.get(target)) !== null && _a !== void 0 ? _a : 'es3';
        const keepClassNames = target >= /* ts.ScriptTarget.ES2016 */ 3;
        return {
            sourceMaps: sourceMap,
            // isModule: true,
            module: {
                type: 'commonjs',
                noInterop: !esModuleInterop,
            },
            swcrc: false,
            jsc: {
                externalHelpers: importHelpers,
                parser: {
                    syntax: 'typescript',
                    tsx: isTsx,
                    decorators: experimentalDecorators,
                    dynamicImport: true,
                },
                target: swcTarget,
                transform: {
                    decoratorMetadata: emitDecoratorMetadata,
                    legacyDecorator: true,
                    react: {
                        throwIfNamespace: false,
                        development: false,
                        useBuiltins: false,
                        pragma: jsxFactory,
                        pragmaFrag: jsxFragmentFactory,
                    },
                },
                keepClassNames,
            },
        };
    }
    const transpile = (input, transpileOptions) => {
        const { fileName } = transpileOptions;
        const swcOptions = fileName.endsWith('.tsx') || fileName.endsWith('.jsx')
            ? tsxOptions
            : nonTsxOptions;
        const { code, map } = swcInstance.transformSync(input, Object.assign(Object.assign({}, swcOptions), { filename: fileName }));
        return { outputText: code, sourceMapText: map };
    };
    return {
        transpile,
    };
}
exports.create = create;
const targetMapping = new Map();
targetMapping.set(/* ts.ScriptTarget.ES3 */ 0, 'es3');
targetMapping.set(/* ts.ScriptTarget.ES5 */ 1, 'es5');
targetMapping.set(/* ts.ScriptTarget.ES2015 */ 2, 'es2015');
targetMapping.set(/* ts.ScriptTarget.ES2016 */ 3, 'es2016');
targetMapping.set(/* ts.ScriptTarget.ES2017 */ 4, 'es2017');
targetMapping.set(/* ts.ScriptTarget.ES2018 */ 5, 'es2018');
targetMapping.set(/* ts.ScriptTarget.ES2019 */ 6, 'es2019');
targetMapping.set(/* ts.ScriptTarget.ES2020 */ 7, 'es2019');
targetMapping.set(/* ts.ScriptTarget.ESNext */ 99, 'es2019');
//# sourceMappingURL=swc.js.map