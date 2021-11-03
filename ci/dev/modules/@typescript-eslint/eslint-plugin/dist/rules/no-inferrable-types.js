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
    name: 'no-inferrable-types',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallows explicit type declarations for variables or parameters initialized to a number, string, or boolean',
            category: 'Best Practices',
            recommended: 'error',
        },
        fixable: 'code',
        messages: {
            noInferrableType: 'Type {{type}} trivially inferred from a {{type}} literal, remove type annotation.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    ignoreParameters: {
                        type: 'boolean',
                    },
                    ignoreProperties: {
                        type: 'boolean',
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    defaultOptions: [
        {
            ignoreParameters: false,
            ignoreProperties: false,
        },
    ],
    create(context, [{ ignoreParameters, ignoreProperties }]) {
        function isFunctionCall(init, callName) {
            if (init.type === experimental_utils_1.AST_NODE_TYPES.ChainExpression) {
                return isFunctionCall(init.expression, callName);
            }
            return (init.type === experimental_utils_1.AST_NODE_TYPES.CallExpression &&
                init.callee.type === experimental_utils_1.AST_NODE_TYPES.Identifier &&
                init.callee.name === callName);
        }
        function isLiteral(init, typeName) {
            return (init.type === experimental_utils_1.AST_NODE_TYPES.Literal && typeof init.value === typeName);
        }
        function isIdentifier(init, ...names) {
            return (init.type === experimental_utils_1.AST_NODE_TYPES.Identifier && names.includes(init.name));
        }
        function hasUnaryPrefix(init, ...operators) {
            return (init.type === experimental_utils_1.AST_NODE_TYPES.UnaryExpression &&
                operators.includes(init.operator));
        }
        const keywordMap = {
            [experimental_utils_1.AST_NODE_TYPES.TSBigIntKeyword]: 'bigint',
            [experimental_utils_1.AST_NODE_TYPES.TSBooleanKeyword]: 'boolean',
            [experimental_utils_1.AST_NODE_TYPES.TSNumberKeyword]: 'number',
            [experimental_utils_1.AST_NODE_TYPES.TSNullKeyword]: 'null',
            [experimental_utils_1.AST_NODE_TYPES.TSStringKeyword]: 'string',
            [experimental_utils_1.AST_NODE_TYPES.TSSymbolKeyword]: 'symbol',
            [experimental_utils_1.AST_NODE_TYPES.TSUndefinedKeyword]: 'undefined',
        };
        /**
         * Returns whether a node has an inferrable value or not
         */
        function isInferrable(annotation, init) {
            switch (annotation.type) {
                case experimental_utils_1.AST_NODE_TYPES.TSBigIntKeyword: {
                    // note that bigint cannot have + prefixed to it
                    const unwrappedInit = hasUnaryPrefix(init, '-')
                        ? init.argument
                        : init;
                    return (isFunctionCall(unwrappedInit, 'BigInt') ||
                        (unwrappedInit.type === experimental_utils_1.AST_NODE_TYPES.Literal &&
                            'bigint' in unwrappedInit));
                }
                case experimental_utils_1.AST_NODE_TYPES.TSBooleanKeyword:
                    return (hasUnaryPrefix(init, '!') ||
                        // eslint-disable-next-line @typescript-eslint/internal/prefer-ast-types-enum
                        isFunctionCall(init, 'Boolean') ||
                        isLiteral(init, 'boolean'));
                case experimental_utils_1.AST_NODE_TYPES.TSNumberKeyword: {
                    const unwrappedInit = hasUnaryPrefix(init, '+', '-')
                        ? init.argument
                        : init;
                    return (isIdentifier(unwrappedInit, 'Infinity', 'NaN') ||
                        isFunctionCall(unwrappedInit, 'Number') ||
                        isLiteral(unwrappedInit, 'number'));
                }
                case experimental_utils_1.AST_NODE_TYPES.TSNullKeyword:
                    return init.type === experimental_utils_1.AST_NODE_TYPES.Literal && init.value === null;
                case experimental_utils_1.AST_NODE_TYPES.TSStringKeyword:
                    return (
                    // eslint-disable-next-line @typescript-eslint/internal/prefer-ast-types-enum
                    isFunctionCall(init, 'String') ||
                        isLiteral(init, 'string') ||
                        init.type === experimental_utils_1.AST_NODE_TYPES.TemplateLiteral);
                case experimental_utils_1.AST_NODE_TYPES.TSSymbolKeyword:
                    return isFunctionCall(init, 'Symbol');
                case experimental_utils_1.AST_NODE_TYPES.TSTypeReference: {
                    if (annotation.typeName.type === experimental_utils_1.AST_NODE_TYPES.Identifier &&
                        annotation.typeName.name === 'RegExp') {
                        const isRegExpLiteral = init.type === experimental_utils_1.AST_NODE_TYPES.Literal &&
                            init.value instanceof RegExp;
                        const isRegExpNewCall = init.type === experimental_utils_1.AST_NODE_TYPES.NewExpression &&
                            init.callee.type === experimental_utils_1.AST_NODE_TYPES.Identifier &&
                            init.callee.name === 'RegExp';
                        const isRegExpCall = isFunctionCall(init, 'RegExp');
                        return isRegExpLiteral || isRegExpCall || isRegExpNewCall;
                    }
                    return false;
                }
                case experimental_utils_1.AST_NODE_TYPES.TSUndefinedKeyword:
                    return (hasUnaryPrefix(init, 'void') || isIdentifier(init, 'undefined'));
            }
            return false;
        }
        /**
         * Reports an inferrable type declaration, if any
         */
        function reportInferrableType(node, typeNode, initNode) {
            if (!typeNode || !initNode || !typeNode.typeAnnotation) {
                return;
            }
            if (!isInferrable(typeNode.typeAnnotation, initNode)) {
                return;
            }
            const type = typeNode.typeAnnotation.type === experimental_utils_1.AST_NODE_TYPES.TSTypeReference
                ? // TODO - if we add more references
                    'RegExp'
                : keywordMap[typeNode.typeAnnotation.type];
            context.report({
                node,
                messageId: 'noInferrableType',
                data: {
                    type,
                },
                fix: fixer => fixer.remove(typeNode),
            });
        }
        function inferrableVariableVisitor(node) {
            if (!node.id) {
                return;
            }
            reportInferrableType(node, node.id.typeAnnotation, node.init);
        }
        function inferrableParameterVisitor(node) {
            if (ignoreParameters || !node.params) {
                return;
            }
            node.params.filter(param => param.type === experimental_utils_1.AST_NODE_TYPES.AssignmentPattern &&
                param.left &&
                param.right).forEach(param => {
                reportInferrableType(param, param.left.typeAnnotation, param.right);
            });
        }
        function inferrablePropertyVisitor(node) {
            // We ignore `readonly` because of Microsoft/TypeScript#14416
            // Essentially a readonly property without a type
            // will result in its value being the type, leading to
            // compile errors if the type is stripped.
            if (ignoreProperties || node.readonly || node.optional) {
                return;
            }
            reportInferrableType(node, node.typeAnnotation, node.value);
        }
        return {
            VariableDeclarator: inferrableVariableVisitor,
            FunctionExpression: inferrableParameterVisitor,
            FunctionDeclaration: inferrableParameterVisitor,
            ArrowFunctionExpression: inferrableParameterVisitor,
            ClassProperty: inferrablePropertyVisitor,
        };
    },
});
//# sourceMappingURL=no-inferrable-types.js.map