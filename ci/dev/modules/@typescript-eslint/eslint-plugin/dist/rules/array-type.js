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
/**
 * Check whatever node can be considered as simple
 * @param node the node to be evaluated.
 */
function isSimpleType(node) {
    switch (node.type) {
        case experimental_utils_1.AST_NODE_TYPES.Identifier:
        case experimental_utils_1.AST_NODE_TYPES.TSAnyKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSBooleanKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSNeverKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSNumberKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSObjectKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSStringKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSSymbolKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSUnknownKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSVoidKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSNullKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSArrayType:
        case experimental_utils_1.AST_NODE_TYPES.TSUndefinedKeyword:
        case experimental_utils_1.AST_NODE_TYPES.TSThisType:
        case experimental_utils_1.AST_NODE_TYPES.TSQualifiedName:
            return true;
        case experimental_utils_1.AST_NODE_TYPES.TSTypeReference:
            if (node.typeName &&
                node.typeName.type === experimental_utils_1.AST_NODE_TYPES.Identifier &&
                node.typeName.name === 'Array') {
                if (!node.typeParameters) {
                    return true;
                }
                if (node.typeParameters.params.length === 1) {
                    return isSimpleType(node.typeParameters.params[0]);
                }
            }
            else {
                if (node.typeParameters) {
                    return false;
                }
                return isSimpleType(node.typeName);
            }
            return false;
        default:
            return false;
    }
}
/**
 * Check if node needs parentheses
 * @param node the node to be evaluated.
 */
function typeNeedsParentheses(node) {
    switch (node.type) {
        case experimental_utils_1.AST_NODE_TYPES.TSTypeReference:
            return typeNeedsParentheses(node.typeName);
        case experimental_utils_1.AST_NODE_TYPES.TSUnionType:
        case experimental_utils_1.AST_NODE_TYPES.TSFunctionType:
        case experimental_utils_1.AST_NODE_TYPES.TSIntersectionType:
        case experimental_utils_1.AST_NODE_TYPES.TSTypeOperator:
        case experimental_utils_1.AST_NODE_TYPES.TSInferType:
            return true;
        case experimental_utils_1.AST_NODE_TYPES.Identifier:
            return node.name === 'ReadonlyArray';
        default:
            return false;
    }
}
const arrayOption = { enum: ['array', 'generic', 'array-simple'] };
exports.default = util.createRule({
    name: 'array-type',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Requires using either `T[]` or `Array<T>` for arrays',
            category: 'Stylistic Issues',
            // too opinionated to be recommended
            recommended: false,
        },
        fixable: 'code',
        messages: {
            errorStringGeneric: "Array type using '{{type}}[]' is forbidden. Use 'Array<{{type}}>' instead.",
            errorStringGenericSimple: "Array type using '{{type}}[]' is forbidden for non-simple types. Use 'Array<{{type}}>' instead.",
            errorStringArray: "Array type using 'Array<{{type}}>' is forbidden. Use '{{type}}[]' instead.",
            errorStringArraySimple: "Array type using 'Array<{{type}}>' is forbidden for simple types. Use '{{type}}[]' instead.",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    default: arrayOption,
                    readonly: arrayOption,
                },
            },
        ],
    },
    defaultOptions: [
        {
            default: 'array',
        },
    ],
    create(context, [options]) {
        var _a;
        const sourceCode = context.getSourceCode();
        const defaultOption = options.default;
        const readonlyOption = (_a = options.readonly) !== null && _a !== void 0 ? _a : defaultOption;
        /**
         * @param node the node to be evaluated.
         */
        function getMessageType(node) {
            if (node) {
                if (node.type === experimental_utils_1.AST_NODE_TYPES.TSParenthesizedType) {
                    return getMessageType(node.typeAnnotation);
                }
                if (isSimpleType(node)) {
                    return sourceCode.getText(node);
                }
            }
            return 'T';
        }
        return {
            TSArrayType(node) {
                const isReadonly = node.parent &&
                    node.parent.type === experimental_utils_1.AST_NODE_TYPES.TSTypeOperator &&
                    node.parent.operator === 'readonly';
                const currentOption = isReadonly ? readonlyOption : defaultOption;
                if (currentOption === 'array' ||
                    (currentOption === 'array-simple' && isSimpleType(node.elementType))) {
                    return;
                }
                const messageId = currentOption === 'generic'
                    ? 'errorStringGeneric'
                    : 'errorStringGenericSimple';
                const errorNode = isReadonly ? node.parent : node;
                context.report({
                    node: errorNode,
                    messageId,
                    data: {
                        type: getMessageType(node.elementType),
                    },
                    fix(fixer) {
                        const typeNode = node.elementType.type === experimental_utils_1.AST_NODE_TYPES.TSParenthesizedType
                            ? node.elementType.typeAnnotation
                            : node.elementType;
                        const arrayType = isReadonly ? 'ReadonlyArray' : 'Array';
                        return [
                            fixer.replaceTextRange([errorNode.range[0], typeNode.range[0]], `${arrayType}<`),
                            fixer.replaceTextRange([typeNode.range[1], errorNode.range[1]], '>'),
                        ];
                    },
                });
            },
            TSTypeReference(node) {
                var _a, _b;
                if (node.typeName.type !== experimental_utils_1.AST_NODE_TYPES.Identifier ||
                    !(node.typeName.name === 'Array' ||
                        node.typeName.name === 'ReadonlyArray')) {
                    return;
                }
                const isReadonlyArrayType = node.typeName.name === 'ReadonlyArray';
                const currentOption = isReadonlyArrayType
                    ? readonlyOption
                    : defaultOption;
                if (currentOption === 'generic') {
                    return;
                }
                const readonlyPrefix = isReadonlyArrayType ? 'readonly ' : '';
                const typeParams = (_a = node.typeParameters) === null || _a === void 0 ? void 0 : _a.params;
                const messageId = currentOption === 'array'
                    ? 'errorStringArray'
                    : 'errorStringArraySimple';
                if (!typeParams || typeParams.length === 0) {
                    // Create an 'any' array
                    context.report({
                        node,
                        messageId,
                        data: {
                            type: 'any',
                        },
                        fix(fixer) {
                            return fixer.replaceText(node, `${readonlyPrefix}any[]`);
                        },
                    });
                    return;
                }
                if (typeParams.length !== 1 ||
                    (currentOption === 'array-simple' && !isSimpleType(typeParams[0]))) {
                    return;
                }
                const type = typeParams[0];
                const typeParens = typeNeedsParentheses(type);
                const parentParens = readonlyPrefix && ((_b = node.parent) === null || _b === void 0 ? void 0 : _b.type) === experimental_utils_1.AST_NODE_TYPES.TSArrayType;
                const start = `${parentParens ? '(' : ''}${readonlyPrefix}${typeParens ? '(' : ''}`;
                const end = `${typeParens ? ')' : ''}[]${parentParens ? ')' : ''}`;
                context.report({
                    node,
                    messageId,
                    data: {
                        type: getMessageType(type),
                    },
                    fix(fixer) {
                        return [
                            fixer.replaceTextRange([node.range[0], type.range[0]], start),
                            fixer.replaceTextRange([type.range[1], node.range[1]], end),
                        ];
                    },
                });
            },
        };
    },
});
//# sourceMappingURL=array-type.js.map