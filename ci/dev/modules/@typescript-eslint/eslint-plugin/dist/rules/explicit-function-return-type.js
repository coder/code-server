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
const explicitReturnTypeUtils_1 = require("../util/explicitReturnTypeUtils");
exports.default = util.createRule({
    name: 'explicit-function-return-type',
    meta: {
        type: 'problem',
        docs: {
            description: 'Require explicit return types on functions and class methods',
            category: 'Stylistic Issues',
            recommended: false,
        },
        messages: {
            missingReturnType: 'Missing return type on function.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    allowExpressions: {
                        type: 'boolean',
                    },
                    allowTypedFunctionExpressions: {
                        type: 'boolean',
                    },
                    allowHigherOrderFunctions: {
                        type: 'boolean',
                    },
                    allowDirectConstAssertionInArrowFunctions: {
                        type: 'boolean',
                    },
                    allowConciseArrowFunctionExpressionsStartingWithVoid: {
                        type: 'boolean',
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    defaultOptions: [
        {
            allowExpressions: false,
            allowTypedFunctionExpressions: true,
            allowHigherOrderFunctions: true,
            allowDirectConstAssertionInArrowFunctions: true,
            allowConciseArrowFunctionExpressionsStartingWithVoid: false,
        },
    ],
    create(context, [options]) {
        const sourceCode = context.getSourceCode();
        return {
            'ArrowFunctionExpression, FunctionExpression'(node) {
                if (options.allowConciseArrowFunctionExpressionsStartingWithVoid &&
                    node.type === experimental_utils_1.AST_NODE_TYPES.ArrowFunctionExpression &&
                    node.expression &&
                    node.body.type === experimental_utils_1.AST_NODE_TYPES.UnaryExpression &&
                    node.body.operator === 'void') {
                    return;
                }
                explicitReturnTypeUtils_1.checkFunctionExpressionReturnType(node, options, sourceCode, loc => context.report({
                    node,
                    loc,
                    messageId: 'missingReturnType',
                }));
            },
            FunctionDeclaration(node) {
                explicitReturnTypeUtils_1.checkFunctionReturnType(node, options, sourceCode, loc => context.report({
                    node,
                    loc,
                    messageId: 'missingReturnType',
                }));
            },
        };
    },
});
//# sourceMappingURL=explicit-function-return-type.js.map