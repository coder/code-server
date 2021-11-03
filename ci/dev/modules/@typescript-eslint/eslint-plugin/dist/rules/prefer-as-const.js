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
const util = __importStar(require("../util"));
exports.default = util.createRule({
    name: 'prefer-as-const',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Prefer usage of `as const` over literal type',
            category: 'Best Practices',
            recommended: 'error',
            suggestion: true,
        },
        fixable: 'code',
        messages: {
            preferConstAssertion: 'Expected a `const` instead of a literal type assertion.',
            variableConstAssertion: 'Expected a `const` assertion instead of a literal type annotation.',
            variableSuggest: 'You should use `as const` instead of type annotation.',
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        function compareTypes(valueNode, typeNode, canFix) {
            if (valueNode.type === experimental_utils_1.AST_NODE_TYPES.Literal &&
                typeNode.type === experimental_utils_1.AST_NODE_TYPES.TSLiteralType &&
                'raw' in typeNode.literal &&
                valueNode.raw === typeNode.literal.raw) {
                if (canFix) {
                    context.report({
                        node: typeNode,
                        messageId: 'preferConstAssertion',
                        fix: fixer => fixer.replaceText(typeNode, 'const'),
                    });
                }
                else {
                    context.report({
                        node: typeNode,
                        messageId: 'variableConstAssertion',
                        suggest: [
                            {
                                messageId: 'variableSuggest',
                                fix: (fixer) => [
                                    fixer.remove(typeNode.parent),
                                    fixer.insertTextAfter(valueNode, ' as const'),
                                ],
                            },
                        ],
                    });
                }
            }
        }
        return {
            TSAsExpression(node) {
                compareTypes(node.expression, node.typeAnnotation, true);
            },
            TSTypeAssertion(node) {
                compareTypes(node.expression, node.typeAnnotation, true);
            },
            VariableDeclarator(node) {
                if (node.init && node.id.typeAnnotation) {
                    compareTypes(node.init, node.id.typeAnnotation.typeAnnotation, false);
                }
            },
        };
    },
});
//# sourceMappingURL=prefer-as-const.js.map