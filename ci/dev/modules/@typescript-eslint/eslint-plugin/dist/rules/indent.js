"use strict";
/**
 * Note this file is rather type-unsafe in its current state.
 * This is due to some really funky type conversions between different node types.
 * This is done intentionally based on the internal implementation of the base indent rule.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment  */
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const indent_1 = __importDefault(require("eslint/lib/rules/indent"));
const util = __importStar(require("../util"));
const KNOWN_NODES = new Set([
    // Class properties aren't yet supported by eslint...
    experimental_utils_1.AST_NODE_TYPES.ClassProperty,
    // ts keywords
    experimental_utils_1.AST_NODE_TYPES.TSAbstractKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSAnyKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSBooleanKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSNeverKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSNumberKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSStringKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSSymbolKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSUndefinedKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSUnknownKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSVoidKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSNullKeyword,
    // ts specific nodes we want to support
    experimental_utils_1.AST_NODE_TYPES.TSAbstractClassProperty,
    experimental_utils_1.AST_NODE_TYPES.TSAbstractMethodDefinition,
    experimental_utils_1.AST_NODE_TYPES.TSArrayType,
    experimental_utils_1.AST_NODE_TYPES.TSAsExpression,
    experimental_utils_1.AST_NODE_TYPES.TSCallSignatureDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSConditionalType,
    experimental_utils_1.AST_NODE_TYPES.TSConstructorType,
    experimental_utils_1.AST_NODE_TYPES.TSConstructSignatureDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSDeclareFunction,
    experimental_utils_1.AST_NODE_TYPES.TSEmptyBodyFunctionExpression,
    experimental_utils_1.AST_NODE_TYPES.TSEnumDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSEnumMember,
    experimental_utils_1.AST_NODE_TYPES.TSExportAssignment,
    experimental_utils_1.AST_NODE_TYPES.TSExternalModuleReference,
    experimental_utils_1.AST_NODE_TYPES.TSFunctionType,
    experimental_utils_1.AST_NODE_TYPES.TSImportType,
    experimental_utils_1.AST_NODE_TYPES.TSIndexedAccessType,
    experimental_utils_1.AST_NODE_TYPES.TSIndexSignature,
    experimental_utils_1.AST_NODE_TYPES.TSInferType,
    experimental_utils_1.AST_NODE_TYPES.TSInterfaceBody,
    experimental_utils_1.AST_NODE_TYPES.TSInterfaceDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSInterfaceHeritage,
    experimental_utils_1.AST_NODE_TYPES.TSIntersectionType,
    experimental_utils_1.AST_NODE_TYPES.TSImportEqualsDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSLiteralType,
    experimental_utils_1.AST_NODE_TYPES.TSMappedType,
    experimental_utils_1.AST_NODE_TYPES.TSMethodSignature,
    'TSMinusToken',
    experimental_utils_1.AST_NODE_TYPES.TSModuleBlock,
    experimental_utils_1.AST_NODE_TYPES.TSModuleDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSNonNullExpression,
    experimental_utils_1.AST_NODE_TYPES.TSParameterProperty,
    experimental_utils_1.AST_NODE_TYPES.TSParenthesizedType,
    'TSPlusToken',
    experimental_utils_1.AST_NODE_TYPES.TSPropertySignature,
    experimental_utils_1.AST_NODE_TYPES.TSQualifiedName,
    'TSQuestionToken',
    experimental_utils_1.AST_NODE_TYPES.TSRestType,
    experimental_utils_1.AST_NODE_TYPES.TSThisType,
    experimental_utils_1.AST_NODE_TYPES.TSTupleType,
    experimental_utils_1.AST_NODE_TYPES.TSTypeAnnotation,
    experimental_utils_1.AST_NODE_TYPES.TSTypeLiteral,
    experimental_utils_1.AST_NODE_TYPES.TSTypeOperator,
    experimental_utils_1.AST_NODE_TYPES.TSTypeParameter,
    experimental_utils_1.AST_NODE_TYPES.TSTypeParameterDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSTypeParameterInstantiation,
    experimental_utils_1.AST_NODE_TYPES.TSTypeReference,
    experimental_utils_1.AST_NODE_TYPES.TSUnionType,
    experimental_utils_1.AST_NODE_TYPES.Decorator,
]);
exports.default = util.createRule({
    name: 'indent',
    meta: {
        type: 'layout',
        docs: {
            description: 'Enforce consistent indentation',
            category: 'Stylistic Issues',
            // too opinionated to be recommended
            recommended: false,
            extendsBaseRule: true,
        },
        fixable: 'whitespace',
        schema: indent_1.default.meta.schema,
        messages: (_a = indent_1.default.meta.messages) !== null && _a !== void 0 ? _a : {
            wrongIndentation: 'Expected indentation of {{expected}} but found {{actual}}.',
        },
    },
    defaultOptions: [
        // typescript docs and playground use 4 space indent
        4,
        {
            // typescript docs indent the case from the switch
            // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-1-8.html#example-4
            SwitchCase: 1,
            flatTernaryExpressions: false,
            ignoredNodes: [],
        },
    ],
    create(context, optionsWithDefaults) {
        // because we extend the base rule, have to update opts on the context
        // the context defines options as readonly though...
        const contextWithDefaults = Object.create(context, {
            options: {
                writable: false,
                configurable: false,
                value: optionsWithDefaults,
            },
        });
        const rules = indent_1.default.create(contextWithDefaults);
        /**
         * Converts from a TSPropertySignature to a Property
         * @param node a TSPropertySignature node
         * @param [type] the type to give the new node
         * @returns a Property node
         */
        function TSPropertySignatureToProperty(node, type = experimental_utils_1.AST_NODE_TYPES.Property) {
            const base = {
                // indent doesn't actually use these
                key: null,
                value: null,
                // Property flags
                computed: false,
                method: false,
                kind: 'init',
                // this will stop eslint from interrogating the type literal
                shorthand: true,
                // location data
                parent: node.parent,
                range: node.range,
                loc: node.loc,
            };
            if (type === experimental_utils_1.AST_NODE_TYPES.Property) {
                return Object.assign({ type }, base);
            }
            else {
                return Object.assign({ type, static: false, readonly: false, declare: false }, base);
            }
        }
        return Object.assign({}, rules, {
            // overwrite the base rule here so we can use our KNOWN_NODES list instead
            '*:exit'(node) {
                // For nodes we care about, skip the default handling, because it just marks the node as ignored...
                if (!KNOWN_NODES.has(node.type)) {
                    rules['*:exit'](node);
                }
            },
            VariableDeclaration(node) {
                // https://github.com/typescript-eslint/typescript-eslint/issues/441
                if (node.declarations.length === 0) {
                    return;
                }
                return rules.VariableDeclaration(node);
            },
            TSAsExpression(node) {
                // transform it to a BinaryExpression
                return rules['BinaryExpression, LogicalExpression']({
                    type: experimental_utils_1.AST_NODE_TYPES.BinaryExpression,
                    operator: 'as',
                    left: node.expression,
                    // the first typeAnnotation includes the as token
                    right: node.typeAnnotation,
                    // location data
                    parent: node.parent,
                    range: node.range,
                    loc: node.loc,
                });
            },
            TSConditionalType(node) {
                // transform it to a ConditionalExpression
                return rules.ConditionalExpression({
                    type: experimental_utils_1.AST_NODE_TYPES.ConditionalExpression,
                    test: {
                        type: experimental_utils_1.AST_NODE_TYPES.BinaryExpression,
                        operator: 'extends',
                        left: node.checkType,
                        right: node.extendsType,
                        // location data
                        range: [node.checkType.range[0], node.extendsType.range[1]],
                        loc: {
                            start: node.checkType.loc.start,
                            end: node.extendsType.loc.end,
                        },
                    },
                    consequent: node.trueType,
                    alternate: node.falseType,
                    // location data
                    parent: node.parent,
                    range: node.range,
                    loc: node.loc,
                });
            },
            'TSEnumDeclaration, TSTypeLiteral'(node) {
                // transform it to an ObjectExpression
                return rules['ObjectExpression, ObjectPattern']({
                    type: experimental_utils_1.AST_NODE_TYPES.ObjectExpression,
                    properties: node.members.map(member => TSPropertySignatureToProperty(member)),
                    // location data
                    parent: node.parent,
                    range: node.range,
                    loc: node.loc,
                });
            },
            TSImportEqualsDeclaration(node) {
                // transform it to an VariableDeclaration
                // use VariableDeclaration instead of ImportDeclaration because it's essentially the same thing
                const { id, moduleReference } = node;
                return rules.VariableDeclaration({
                    type: experimental_utils_1.AST_NODE_TYPES.VariableDeclaration,
                    kind: 'const',
                    declarations: [
                        {
                            type: experimental_utils_1.AST_NODE_TYPES.VariableDeclarator,
                            range: [id.range[0], moduleReference.range[1]],
                            loc: {
                                start: id.loc.start,
                                end: moduleReference.loc.end,
                            },
                            id: id,
                            init: {
                                type: experimental_utils_1.AST_NODE_TYPES.CallExpression,
                                callee: {
                                    type: experimental_utils_1.AST_NODE_TYPES.Identifier,
                                    name: 'require',
                                    range: [
                                        moduleReference.range[0],
                                        moduleReference.range[0] + 'require'.length,
                                    ],
                                    loc: {
                                        start: moduleReference.loc.start,
                                        end: {
                                            line: moduleReference.loc.end.line,
                                            column: moduleReference.loc.start.line + 'require'.length,
                                        },
                                    },
                                },
                                arguments: 'expression' in moduleReference
                                    ? [moduleReference.expression]
                                    : [],
                                // location data
                                range: moduleReference.range,
                                loc: moduleReference.loc,
                            },
                        },
                    ],
                    // location data
                    parent: node.parent,
                    range: node.range,
                    loc: node.loc,
                });
            },
            TSIndexedAccessType(node) {
                // convert to a MemberExpression
                return rules['MemberExpression, JSXMemberExpression, MetaProperty']({
                    type: experimental_utils_1.AST_NODE_TYPES.MemberExpression,
                    object: node.objectType,
                    property: node.indexType,
                    // location data
                    parent: node.parent,
                    range: node.range,
                    loc: node.loc,
                    optional: false,
                    computed: true,
                });
            },
            TSInterfaceBody(node) {
                // transform it to an ClassBody
                return rules['BlockStatement, ClassBody']({
                    type: experimental_utils_1.AST_NODE_TYPES.ClassBody,
                    body: node.body.map(p => TSPropertySignatureToProperty(p, experimental_utils_1.AST_NODE_TYPES.ClassProperty)),
                    // location data
                    parent: node.parent,
                    range: node.range,
                    loc: node.loc,
                });
            },
            'TSInterfaceDeclaration[extends.length > 0]'(node) {
                // transform it to a ClassDeclaration
                return rules['ClassDeclaration[superClass], ClassExpression[superClass]']({
                    type: experimental_utils_1.AST_NODE_TYPES.ClassDeclaration,
                    body: node.body,
                    id: null,
                    // TODO: This is invalid, there can be more than one extends in interface
                    superClass: node.extends[0].expression,
                    // location data
                    parent: node.parent,
                    range: node.range,
                    loc: node.loc,
                });
            },
            TSMappedType(node) {
                const sourceCode = context.getSourceCode();
                const squareBracketStart = sourceCode.getTokenBefore(node.typeParameter);
                // transform it to an ObjectExpression
                return rules['ObjectExpression, ObjectPattern']({
                    type: experimental_utils_1.AST_NODE_TYPES.ObjectExpression,
                    properties: [
                        {
                            type: experimental_utils_1.AST_NODE_TYPES.Property,
                            key: node.typeParameter,
                            value: node.typeAnnotation,
                            // location data
                            range: [
                                squareBracketStart.range[0],
                                node.typeAnnotation
                                    ? node.typeAnnotation.range[1]
                                    : squareBracketStart.range[0],
                            ],
                            loc: {
                                start: squareBracketStart.loc.start,
                                end: node.typeAnnotation
                                    ? node.typeAnnotation.loc.end
                                    : squareBracketStart.loc.end,
                            },
                            kind: 'init',
                            computed: false,
                            method: false,
                            shorthand: false,
                        },
                    ],
                    // location data
                    parent: node.parent,
                    range: node.range,
                    loc: node.loc,
                });
            },
            TSModuleBlock(node) {
                // transform it to a BlockStatement
                return rules['BlockStatement, ClassBody']({
                    type: experimental_utils_1.AST_NODE_TYPES.BlockStatement,
                    body: node.body,
                    // location data
                    parent: node.parent,
                    range: node.range,
                    loc: node.loc,
                });
            },
            TSQualifiedName(node) {
                return rules['MemberExpression, JSXMemberExpression, MetaProperty']({
                    type: experimental_utils_1.AST_NODE_TYPES.MemberExpression,
                    object: node.left,
                    property: node.right,
                    // location data
                    parent: node.parent,
                    range: node.range,
                    loc: node.loc,
                    optional: false,
                    computed: false,
                });
            },
            TSTupleType(node) {
                // transform it to an ArrayExpression
                return rules['ArrayExpression, ArrayPattern']({
                    type: experimental_utils_1.AST_NODE_TYPES.ArrayExpression,
                    elements: node.elementTypes,
                    // location data
                    parent: node.parent,
                    range: node.range,
                    loc: node.loc,
                });
            },
            TSTypeParameterDeclaration(node) {
                if (!node.params.length) {
                    return;
                }
                const [name, ...attributes] = node.params;
                // JSX is about the closest we can get because the angle brackets
                // it's not perfect but it works!
                return rules.JSXOpeningElement({
                    type: experimental_utils_1.AST_NODE_TYPES.JSXOpeningElement,
                    selfClosing: false,
                    name: name,
                    attributes: attributes,
                    // location data
                    parent: node.parent,
                    range: node.range,
                    loc: node.loc,
                });
            },
        });
    },
});
//# sourceMappingURL=indent.js.map