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
const util = __importStar(require("../util"));
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
exports.default = util.createRule({
    name: 'consistent-type-assertions',
    meta: {
        type: 'suggestion',
        docs: {
            category: 'Best Practices',
            description: 'Enforces consistent usage of type assertions',
            recommended: false,
        },
        messages: {
            as: "Use 'as {{cast}}' instead of '<{{cast}}>'.",
            'angle-bracket': "Use '<{{cast}}>' instead of 'as {{cast}}'.",
            never: 'Do not use any type assertions.',
            unexpectedObjectTypeAssertion: 'Always prefer const x: T = { ... }.',
        },
        schema: [
            {
                oneOf: [
                    {
                        type: 'object',
                        properties: {
                            assertionStyle: {
                                enum: ['never'],
                            },
                        },
                        additionalProperties: false,
                        required: ['assertionStyle'],
                    },
                    {
                        type: 'object',
                        properties: {
                            assertionStyle: {
                                enum: ['as', 'angle-bracket'],
                            },
                            objectLiteralTypeAssertions: {
                                enum: ['allow', 'allow-as-parameter', 'never'],
                            },
                        },
                        additionalProperties: false,
                        required: ['assertionStyle'],
                    },
                ],
            },
        ],
    },
    defaultOptions: [
        {
            assertionStyle: 'as',
            objectLiteralTypeAssertions: 'allow',
        },
    ],
    create(context, [options]) {
        const sourceCode = context.getSourceCode();
        function isConst(node) {
            if (node.type !== experimental_utils_1.AST_NODE_TYPES.TSTypeReference) {
                return false;
            }
            return (node.typeName.type === experimental_utils_1.AST_NODE_TYPES.Identifier &&
                node.typeName.name === 'const');
        }
        function reportIncorrectAssertionType(node) {
            // If this node is `as const`, then don't report an error.
            if (isConst(node.typeAnnotation)) {
                return;
            }
            const messageId = options.assertionStyle;
            context.report({
                node,
                messageId,
                data: messageId !== 'never'
                    ? { cast: sourceCode.getText(node.typeAnnotation) }
                    : {},
            });
        }
        function checkType(node) {
            switch (node.type) {
                case experimental_utils_1.AST_NODE_TYPES.TSAnyKeyword:
                case experimental_utils_1.AST_NODE_TYPES.TSUnknownKeyword:
                    return false;
                case experimental_utils_1.AST_NODE_TYPES.TSTypeReference:
                    return (
                    // Ignore `as const` and `<const>`
                    !isConst(node) ||
                        // Allow qualified names which have dots between identifiers, `Foo.Bar`
                        node.typeName.type === experimental_utils_1.AST_NODE_TYPES.TSQualifiedName);
                default:
                    return true;
            }
        }
        function checkExpression(node) {
            if (options.assertionStyle === 'never' ||
                options.objectLiteralTypeAssertions === 'allow' ||
                node.expression.type !== experimental_utils_1.AST_NODE_TYPES.ObjectExpression) {
                return;
            }
            if (options.objectLiteralTypeAssertions === 'allow-as-parameter' &&
                node.parent &&
                (node.parent.type === experimental_utils_1.AST_NODE_TYPES.NewExpression ||
                    node.parent.type === experimental_utils_1.AST_NODE_TYPES.CallExpression ||
                    node.parent.type === experimental_utils_1.AST_NODE_TYPES.ThrowStatement ||
                    node.parent.type === experimental_utils_1.AST_NODE_TYPES.AssignmentPattern ||
                    node.parent.type === experimental_utils_1.AST_NODE_TYPES.JSXExpressionContainer)) {
                return;
            }
            if (checkType(node.typeAnnotation) &&
                node.expression.type === experimental_utils_1.AST_NODE_TYPES.ObjectExpression) {
                context.report({
                    node,
                    messageId: 'unexpectedObjectTypeAssertion',
                });
            }
        }
        return {
            TSTypeAssertion(node) {
                if (options.assertionStyle !== 'angle-bracket') {
                    reportIncorrectAssertionType(node);
                    return;
                }
                checkExpression(node);
            },
            TSAsExpression(node) {
                if (options.assertionStyle !== 'as') {
                    reportIncorrectAssertionType(node);
                    return;
                }
                checkExpression(node);
            },
        };
    },
});
//# sourceMappingURL=consistent-type-assertions.js.map