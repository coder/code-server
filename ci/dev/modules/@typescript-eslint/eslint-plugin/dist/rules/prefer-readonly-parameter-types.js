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
    name: 'prefer-readonly-parameter-types',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Requires that function parameters are typed as readonly to prevent accidental mutation of inputs',
            category: 'Possible Errors',
            recommended: false,
            requiresTypeChecking: true,
        },
        schema: [
            {
                type: 'object',
                additionalProperties: false,
                properties: {
                    checkParameterProperties: {
                        type: 'boolean',
                    },
                    ignoreInferredTypes: {
                        type: 'boolean',
                    },
                },
            },
        ],
        messages: {
            shouldBeReadonly: 'Parameter should be a read only type.',
        },
    },
    defaultOptions: [
        {
            checkParameterProperties: true,
            ignoreInferredTypes: false,
        },
    ],
    create(context, options) {
        const [{ checkParameterProperties, ignoreInferredTypes }] = options;
        const { esTreeNodeToTSNodeMap, program } = util.getParserServices(context);
        const checker = program.getTypeChecker();
        return {
            [[
                experimental_utils_1.AST_NODE_TYPES.ArrowFunctionExpression,
                experimental_utils_1.AST_NODE_TYPES.FunctionDeclaration,
                experimental_utils_1.AST_NODE_TYPES.FunctionExpression,
                experimental_utils_1.AST_NODE_TYPES.TSCallSignatureDeclaration,
                experimental_utils_1.AST_NODE_TYPES.TSConstructSignatureDeclaration,
                experimental_utils_1.AST_NODE_TYPES.TSDeclareFunction,
                experimental_utils_1.AST_NODE_TYPES.TSEmptyBodyFunctionExpression,
                experimental_utils_1.AST_NODE_TYPES.TSFunctionType,
                experimental_utils_1.AST_NODE_TYPES.TSMethodSignature,
            ].join(', ')](node) {
                for (const param of node.params) {
                    if (!checkParameterProperties &&
                        param.type === experimental_utils_1.AST_NODE_TYPES.TSParameterProperty) {
                        continue;
                    }
                    const actualParam = param.type === experimental_utils_1.AST_NODE_TYPES.TSParameterProperty
                        ? param.parameter
                        : param;
                    if (ignoreInferredTypes && actualParam.typeAnnotation == null) {
                        continue;
                    }
                    const tsNode = esTreeNodeToTSNodeMap.get(actualParam);
                    const type = checker.getTypeAtLocation(tsNode);
                    const isReadOnly = util.isTypeReadonly(checker, type);
                    if (!isReadOnly) {
                        context.report({
                            node: actualParam,
                            messageId: 'shouldBeReadonly',
                        });
                    }
                }
            },
        };
    },
});
//# sourceMappingURL=prefer-readonly-parameter-types.js.map