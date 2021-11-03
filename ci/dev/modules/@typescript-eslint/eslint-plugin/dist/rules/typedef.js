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
    name: 'typedef',
    meta: {
        docs: {
            description: 'Requires type annotations to exist',
            category: 'Stylistic Issues',
            recommended: false,
        },
        messages: {
            expectedTypedef: 'Expected a type annotation.',
            expectedTypedefNamed: 'Expected {{name}} to have a type annotation.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    ["arrayDestructuring" /* ArrayDestructuring */]: { type: 'boolean' },
                    ["arrowParameter" /* ArrowParameter */]: { type: 'boolean' },
                    ["memberVariableDeclaration" /* MemberVariableDeclaration */]: { type: 'boolean' },
                    ["objectDestructuring" /* ObjectDestructuring */]: { type: 'boolean' },
                    ["parameter" /* Parameter */]: { type: 'boolean' },
                    ["propertyDeclaration" /* PropertyDeclaration */]: { type: 'boolean' },
                    ["variableDeclaration" /* VariableDeclaration */]: { type: 'boolean' },
                    ["variableDeclarationIgnoreFunction" /* VariableDeclarationIgnoreFunction */]: { type: 'boolean' },
                },
            },
        ],
        type: 'suggestion',
    },
    defaultOptions: [
        {
            ["arrayDestructuring" /* ArrayDestructuring */]: false,
            ["arrowParameter" /* ArrowParameter */]: false,
            ["memberVariableDeclaration" /* MemberVariableDeclaration */]: false,
            ["objectDestructuring" /* ObjectDestructuring */]: false,
            ["parameter" /* Parameter */]: false,
            ["propertyDeclaration" /* PropertyDeclaration */]: false,
            ["variableDeclaration" /* VariableDeclaration */]: false,
            ["variableDeclarationIgnoreFunction" /* VariableDeclarationIgnoreFunction */]: false,
        },
    ],
    create(context, [options]) {
        function report(location, name) {
            context.report({
                node: location,
                messageId: name ? 'expectedTypedefNamed' : 'expectedTypedef',
                data: { name },
            });
        }
        function getNodeName(node) {
            return node.type === experimental_utils_1.AST_NODE_TYPES.Identifier ? node.name : undefined;
        }
        function isForOfStatementContext(node) {
            let current = node.parent;
            while (current) {
                switch (current.type) {
                    case experimental_utils_1.AST_NODE_TYPES.VariableDeclarator:
                    case experimental_utils_1.AST_NODE_TYPES.VariableDeclaration:
                    case experimental_utils_1.AST_NODE_TYPES.ObjectPattern:
                    case experimental_utils_1.AST_NODE_TYPES.ArrayPattern:
                    case experimental_utils_1.AST_NODE_TYPES.Property:
                        current = current.parent;
                        break;
                    case experimental_utils_1.AST_NODE_TYPES.ForOfStatement:
                        return true;
                    default:
                        current = undefined;
                }
            }
            return false;
        }
        function checkParameters(params) {
            for (const param of params) {
                let annotationNode;
                switch (param.type) {
                    case experimental_utils_1.AST_NODE_TYPES.AssignmentPattern:
                        annotationNode = param.left;
                        break;
                    case experimental_utils_1.AST_NODE_TYPES.TSParameterProperty:
                        annotationNode = param.parameter;
                        // Check TS parameter property with default value like `constructor(private param: string = 'something') {}`
                        if (annotationNode &&
                            annotationNode.type === experimental_utils_1.AST_NODE_TYPES.AssignmentPattern) {
                            annotationNode = annotationNode.left;
                        }
                        break;
                    default:
                        annotationNode = param;
                        break;
                }
                if (annotationNode !== undefined && !annotationNode.typeAnnotation) {
                    report(param, getNodeName(param));
                }
            }
        }
        function isVariableDeclarationIgnoreFunction(node) {
            return (!!options["variableDeclarationIgnoreFunction" /* VariableDeclarationIgnoreFunction */] &&
                (node.type === experimental_utils_1.AST_NODE_TYPES.FunctionExpression ||
                    node.type === experimental_utils_1.AST_NODE_TYPES.ArrowFunctionExpression));
        }
        return {
            ArrayPattern(node) {
                var _a;
                if (((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type) === experimental_utils_1.AST_NODE_TYPES.RestElement &&
                    node.parent.typeAnnotation) {
                    return;
                }
                if (options["arrayDestructuring" /* ArrayDestructuring */] &&
                    !node.typeAnnotation &&
                    !isForOfStatementContext(node)) {
                    report(node);
                }
            },
            ArrowFunctionExpression(node) {
                if (options["arrowParameter" /* ArrowParameter */]) {
                    checkParameters(node.params);
                }
            },
            ClassProperty(node) {
                if (node.value && isVariableDeclarationIgnoreFunction(node.value)) {
                    return;
                }
                if (options["memberVariableDeclaration" /* MemberVariableDeclaration */] &&
                    !node.typeAnnotation) {
                    report(node, node.key.type === experimental_utils_1.AST_NODE_TYPES.Identifier
                        ? node.key.name
                        : undefined);
                }
            },
            'FunctionDeclaration, FunctionExpression'(node) {
                if (options["parameter" /* Parameter */]) {
                    checkParameters(node.params);
                }
            },
            ObjectPattern(node) {
                if (options["objectDestructuring" /* ObjectDestructuring */] &&
                    !node.typeAnnotation &&
                    !isForOfStatementContext(node)) {
                    report(node);
                }
            },
            'TSIndexSignature, TSPropertySignature'(node) {
                if (options["propertyDeclaration" /* PropertyDeclaration */] && !node.typeAnnotation) {
                    report(node, node.type === experimental_utils_1.AST_NODE_TYPES.TSPropertySignature
                        ? getNodeName(node.key)
                        : undefined);
                }
            },
            VariableDeclarator(node) {
                if (!options["variableDeclaration" /* VariableDeclaration */] ||
                    node.id.typeAnnotation ||
                    (node.id.type === experimental_utils_1.AST_NODE_TYPES.ArrayPattern &&
                        !options["arrayDestructuring" /* ArrayDestructuring */]) ||
                    (node.id.type === experimental_utils_1.AST_NODE_TYPES.ObjectPattern &&
                        !options["objectDestructuring" /* ObjectDestructuring */]) ||
                    (node.init && isVariableDeclarationIgnoreFunction(node.init))) {
                    return;
                }
                let current = node.parent;
                while (current) {
                    switch (current.type) {
                        case experimental_utils_1.AST_NODE_TYPES.VariableDeclaration:
                            // Keep looking upwards
                            current = current.parent;
                            break;
                        case experimental_utils_1.AST_NODE_TYPES.ForOfStatement:
                        case experimental_utils_1.AST_NODE_TYPES.ForInStatement:
                            // Stop traversing and don't report an error
                            return;
                        default:
                            // Stop traversing
                            current = undefined;
                            break;
                    }
                }
                report(node, getNodeName(node.id));
            },
        };
    },
});
//# sourceMappingURL=typedef.js.map