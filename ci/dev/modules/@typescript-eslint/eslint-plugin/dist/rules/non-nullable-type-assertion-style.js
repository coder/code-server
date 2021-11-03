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
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const tsutils = __importStar(require("tsutils"));
const ts = __importStar(require("typescript"));
const util = __importStar(require("../util"));
exports.default = util.createRule({
    name: 'non-nullable-type-assertion-style',
    meta: {
        docs: {
            category: 'Best Practices',
            description: 'Prefers a non-null assertion over explicit type cast when possible',
            recommended: false,
            requiresTypeChecking: true,
            suggestion: true,
        },
        fixable: 'code',
        messages: {
            preferNonNullAssertion: 'Use a ! assertion to more succintly remove null and undefined from the type.',
        },
        schema: [],
        type: 'suggestion',
    },
    defaultOptions: [],
    create(context) {
        const parserServices = util.getParserServices(context);
        const checker = parserServices.program.getTypeChecker();
        const sourceCode = context.getSourceCode();
        const getTypesIfNotLoose = (node) => {
            const type = checker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(node));
            if (tsutils.isTypeFlagSet(type, ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
                return undefined;
            }
            return tsutils.unionTypeParts(type);
        };
        const sameTypeWithoutNullish = (assertedTypes, originalTypes) => {
            const nonNullishOriginalTypes = originalTypes.filter(type => type.flags !== ts.TypeFlags.Null &&
                type.flags !== ts.TypeFlags.Undefined);
            for (const assertedType of assertedTypes) {
                if (!nonNullishOriginalTypes.includes(assertedType)) {
                    return false;
                }
            }
            for (const originalType of nonNullishOriginalTypes) {
                if (!assertedTypes.includes(originalType)) {
                    return false;
                }
            }
            return true;
        };
        const isConstAssertion = (node) => {
            return (node.typeAnnotation.type === experimental_utils_1.AST_NODE_TYPES.TSTypeReference &&
                node.typeAnnotation.typeName.type === experimental_utils_1.AST_NODE_TYPES.Identifier &&
                node.typeAnnotation.typeName.name === 'const');
        };
        return {
            'TSAsExpression, TSTypeAssertion'(node) {
                if (isConstAssertion(node)) {
                    return;
                }
                const originalTypes = getTypesIfNotLoose(node.expression);
                if (!originalTypes) {
                    return;
                }
                const assertedTypes = getTypesIfNotLoose(node.typeAnnotation);
                if (!assertedTypes) {
                    return;
                }
                if (sameTypeWithoutNullish(assertedTypes, originalTypes)) {
                    context.report({
                        fix(fixer) {
                            return fixer.replaceText(node, `${sourceCode.getText(node.expression)}!`);
                        },
                        messageId: 'preferNonNullAssertion',
                        node,
                    });
                }
            },
        };
    },
});
//# sourceMappingURL=non-nullable-type-assertion-style.js.map