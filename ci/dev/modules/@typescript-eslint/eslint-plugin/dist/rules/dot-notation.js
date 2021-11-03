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
const ts = __importStar(require("typescript"));
const tsutils = __importStar(require("tsutils"));
const dot_notation_1 = __importDefault(require("eslint/lib/rules/dot-notation"));
const util_1 = require("../util");
exports.default = util_1.createRule({
    name: 'dot-notation',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'enforce dot notation whenever possible',
            category: 'Best Practices',
            recommended: false,
            extendsBaseRule: true,
            requiresTypeChecking: true,
        },
        schema: [
            {
                type: 'object',
                properties: {
                    allowKeywords: {
                        type: 'boolean',
                        default: true,
                    },
                    allowPattern: {
                        type: 'string',
                        default: '',
                    },
                    allowPrivateClassPropertyAccess: {
                        type: 'boolean',
                        default: false,
                    },
                    allowProtectedClassPropertyAccess: {
                        type: 'boolean',
                        default: false,
                    },
                    allowIndexSignaturePropertyAccess: {
                        type: 'boolean',
                        default: false,
                    },
                },
                additionalProperties: false,
            },
        ],
        fixable: dot_notation_1.default.meta.fixable,
        messages: dot_notation_1.default.meta.messages,
    },
    defaultOptions: [
        {
            allowPrivateClassPropertyAccess: false,
            allowProtectedClassPropertyAccess: false,
            allowIndexSignaturePropertyAccess: false,
            allowKeywords: true,
            allowPattern: '',
        },
    ],
    create(context, [options]) {
        var _a;
        const rules = dot_notation_1.default.create(context);
        const { program, esTreeNodeToTSNodeMap } = util_1.getParserServices(context);
        const typeChecker = program.getTypeChecker();
        const allowPrivateClassPropertyAccess = options.allowPrivateClassPropertyAccess;
        const allowProtectedClassPropertyAccess = options.allowProtectedClassPropertyAccess;
        const allowIndexSignaturePropertyAccess = ((_a = options.allowIndexSignaturePropertyAccess) !== null && _a !== void 0 ? _a : false) ||
            tsutils.isCompilerOptionEnabled(program.getCompilerOptions(), 
            // @ts-expect-error - TS is refining the type to never for some reason
            'noPropertyAccessFromIndexSignature');
        return {
            MemberExpression(node) {
                var _a, _b, _c;
                if ((allowPrivateClassPropertyAccess ||
                    allowProtectedClassPropertyAccess ||
                    allowIndexSignaturePropertyAccess) &&
                    node.computed) {
                    // for perf reasons - only fetch symbols if we have to
                    const propertySymbol = typeChecker.getSymbolAtLocation(esTreeNodeToTSNodeMap.get(node.property));
                    const modifierKind = (_c = (_b = (_a = propertySymbol === null || propertySymbol === void 0 ? void 0 : propertySymbol.getDeclarations()) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.modifiers) === null || _c === void 0 ? void 0 : _c[0].kind;
                    if ((allowPrivateClassPropertyAccess &&
                        modifierKind == ts.SyntaxKind.PrivateKeyword) ||
                        (allowProtectedClassPropertyAccess &&
                            modifierKind == ts.SyntaxKind.ProtectedKeyword)) {
                        return;
                    }
                    if (propertySymbol === undefined &&
                        allowIndexSignaturePropertyAccess) {
                        const objectType = typeChecker.getTypeAtLocation(esTreeNodeToTSNodeMap.get(node.object));
                        const indexType = typeChecker.getIndexTypeOfType(objectType, ts.IndexKind.String);
                        if (indexType != undefined) {
                            return;
                        }
                    }
                }
                rules.MemberExpression(node);
            },
        };
    },
});
//# sourceMappingURL=dot-notation.js.map