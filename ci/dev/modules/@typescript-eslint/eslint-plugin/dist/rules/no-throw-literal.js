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
Object.defineProperty(exports, "__esModule", { value: true });
const ts = __importStar(require("typescript"));
const util = __importStar(require("../util"));
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
exports.default = util.createRule({
    name: 'no-throw-literal',
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow throwing literals as exceptions',
            category: 'Best Practices',
            recommended: false,
            extendsBaseRule: true,
            requiresTypeChecking: true,
        },
        schema: [],
        messages: {
            object: 'Expected an error object to be thrown.',
            undef: 'Do not throw undefined.',
        },
    },
    defaultOptions: [],
    create(context) {
        const parserServices = util.getParserServices(context);
        const program = parserServices.program;
        const checker = program.getTypeChecker();
        function isErrorLike(type) {
            var _a;
            if (type.isIntersection()) {
                return type.types.some(isErrorLike);
            }
            if (type.isUnion()) {
                return type.types.every(isErrorLike);
            }
            const symbol = type.getSymbol();
            if (!symbol) {
                return false;
            }
            if (symbol.getName() === 'Error') {
                const declarations = (_a = symbol.getDeclarations()) !== null && _a !== void 0 ? _a : [];
                for (const declaration of declarations) {
                    const sourceFile = declaration.getSourceFile();
                    if (program.isSourceFileDefaultLibrary(sourceFile)) {
                        return true;
                    }
                }
            }
            if (symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)) {
                for (const baseType of checker.getBaseTypes(type)) {
                    if (isErrorLike(baseType)) {
                        return true;
                    }
                }
            }
            return false;
        }
        function checkThrowArgument(node) {
            if (node.type === experimental_utils_1.AST_NODE_TYPES.AwaitExpression ||
                node.type === experimental_utils_1.AST_NODE_TYPES.YieldExpression) {
                return;
            }
            const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
            const type = checker.getTypeAtLocation(tsNode);
            if (type.flags & ts.TypeFlags.Undefined) {
                context.report({ node, messageId: 'undef' });
                return;
            }
            if (util.isTypeAnyType(type) ||
                util.isTypeUnknownType(type) ||
                isErrorLike(type)) {
                return;
            }
            context.report({ node, messageId: 'object' });
        }
        return {
            ThrowStatement(node) {
                if (node.argument) {
                    checkThrowArgument(node.argument);
                }
            },
        };
    },
});
//# sourceMappingURL=no-throw-literal.js.map