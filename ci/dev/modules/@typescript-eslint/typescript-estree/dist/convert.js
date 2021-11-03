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
exports.Converter = exports.convertError = void 0;
// There's lots of funny stuff due to the typing of ts.Node
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
const ts = __importStar(require("typescript"));
const node_utils_1 = require("./node-utils");
const ts_estree_1 = require("./ts-estree");
const version_check_1 = require("./version-check");
const SyntaxKind = ts.SyntaxKind;
/**
 * Extends and formats a given error object
 * @param error the error object
 * @returns converted error object
 */
function convertError(error) {
    return node_utils_1.createError(error.file, error.start, error.message || error.messageText);
}
exports.convertError = convertError;
class Converter {
    /**
     * Converts a TypeScript node into an ESTree node
     * @param ast the full TypeScript AST
     * @param options additional options for the conversion
     * @returns the converted ESTreeNode
     */
    constructor(ast, options) {
        this.esTreeNodeToTSNodeMap = new WeakMap();
        this.tsNodeToESTreeNodeMap = new WeakMap();
        this.allowPattern = false;
        this.inTypeMode = false;
        this.ast = ast;
        this.options = Object.assign({}, options);
    }
    getASTMaps() {
        return {
            esTreeNodeToTSNodeMap: this.esTreeNodeToTSNodeMap,
            tsNodeToESTreeNodeMap: this.tsNodeToESTreeNodeMap,
        };
    }
    convertProgram() {
        return this.converter(this.ast);
    }
    /**
     * Converts a TypeScript node into an ESTree node.
     * @param node the child ts.Node
     * @param parent parentNode
     * @param inTypeMode flag to determine if we are in typeMode
     * @param allowPattern flag to determine if patterns are allowed
     * @returns the converted ESTree node
     */
    converter(node, parent, inTypeMode, allowPattern) {
        /**
         * Exit early for null and undefined
         */
        if (!node) {
            return null;
        }
        const typeMode = this.inTypeMode;
        const pattern = this.allowPattern;
        if (inTypeMode !== undefined) {
            this.inTypeMode = inTypeMode;
        }
        if (allowPattern !== undefined) {
            this.allowPattern = allowPattern;
        }
        const result = this.convertNode(node, (parent !== null && parent !== void 0 ? parent : node.parent));
        this.registerTSNodeInNodeMap(node, result);
        this.inTypeMode = typeMode;
        this.allowPattern = pattern;
        return result;
    }
    /**
     * Fixes the exports of the given ts.Node
     * @param node the ts.Node
     * @param result result
     * @returns the ESTreeNode with fixed exports
     */
    fixExports(node, result) {
        // check for exports
        if (node.modifiers && node.modifiers[0].kind === SyntaxKind.ExportKeyword) {
            /**
             * Make sure that original node is registered instead of export
             */
            this.registerTSNodeInNodeMap(node, result);
            const exportKeyword = node.modifiers[0];
            const nextModifier = node.modifiers[1];
            const declarationIsDefault = nextModifier && nextModifier.kind === SyntaxKind.DefaultKeyword;
            const varToken = declarationIsDefault
                ? node_utils_1.findNextToken(nextModifier, this.ast, this.ast)
                : node_utils_1.findNextToken(exportKeyword, this.ast, this.ast);
            result.range[0] = varToken.getStart(this.ast);
            result.loc = node_utils_1.getLocFor(result.range[0], result.range[1], this.ast);
            if (declarationIsDefault) {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ExportDefaultDeclaration,
                    declaration: result,
                    range: [exportKeyword.getStart(this.ast), result.range[1]],
                    exportKind: 'value',
                });
            }
            else {
                const isType = result.type === ts_estree_1.AST_NODE_TYPES.TSInterfaceDeclaration ||
                    result.type === ts_estree_1.AST_NODE_TYPES.TSTypeAliasDeclaration;
                const isDeclare = result.declare === true;
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ExportNamedDeclaration,
                    declaration: result,
                    specifiers: [],
                    source: null,
                    exportKind: isType || isDeclare ? 'type' : 'value',
                    range: [exportKeyword.getStart(this.ast), result.range[1]],
                });
            }
        }
        return result;
    }
    /**
     * Register specific TypeScript node into map with first ESTree node provided
     */
    registerTSNodeInNodeMap(node, result) {
        if (result && this.options.shouldPreserveNodeMaps) {
            if (!this.tsNodeToESTreeNodeMap.has(node)) {
                this.tsNodeToESTreeNodeMap.set(node, result);
            }
        }
    }
    /**
     * Converts a TypeScript node into an ESTree node.
     * @param child the child ts.Node
     * @param parent parentNode
     * @returns the converted ESTree node
     */
    convertPattern(child, parent) {
        return this.converter(child, parent, this.inTypeMode, true);
    }
    /**
     * Converts a TypeScript node into an ESTree node.
     * @param child the child ts.Node
     * @param parent parentNode
     * @returns the converted ESTree node
     */
    convertChild(child, parent) {
        return this.converter(child, parent, this.inTypeMode, false);
    }
    /**
     * Converts a TypeScript node into an ESTree node.
     * @param child the child ts.Node
     * @param parent parentNode
     * @returns the converted ESTree node
     */
    convertType(child, parent) {
        return this.converter(child, parent, true, false);
    }
    createNode(node, data) {
        const result = data;
        if (!result.range) {
            result.range = node_utils_1.getRange(
            // this is completely valid, but TS hates it
            node, this.ast);
        }
        if (!result.loc) {
            result.loc = node_utils_1.getLocFor(result.range[0], result.range[1], this.ast);
        }
        if (result && this.options.shouldPreserveNodeMaps) {
            this.esTreeNodeToTSNodeMap.set(result, node);
        }
        return result;
    }
    convertBindingNameWithTypeAnnotation(name, tsType, parent) {
        const id = this.convertPattern(name);
        if (tsType) {
            id.typeAnnotation = this.convertTypeAnnotation(tsType, parent);
            this.fixParentLocation(id, id.typeAnnotation.range);
        }
        return id;
    }
    /**
     * Converts a child into a type annotation. This creates an intermediary
     * TypeAnnotation node to match what Flow does.
     * @param child The TypeScript AST node to convert.
     * @param parent parentNode
     * @returns The type annotation node.
     */
    convertTypeAnnotation(child, parent) {
        // in FunctionType and ConstructorType typeAnnotation has 2 characters `=>` and in other places is just colon
        const offset = (parent === null || parent === void 0 ? void 0 : parent.kind) === SyntaxKind.FunctionType ||
            (parent === null || parent === void 0 ? void 0 : parent.kind) === SyntaxKind.ConstructorType
            ? 2
            : 1;
        const annotationStartCol = child.getFullStart() - offset;
        const loc = node_utils_1.getLocFor(annotationStartCol, child.end, this.ast);
        return {
            type: ts_estree_1.AST_NODE_TYPES.TSTypeAnnotation,
            loc,
            range: [annotationStartCol, child.end],
            typeAnnotation: this.convertType(child),
        };
    }
    /**
     * Coverts body Nodes and add a directive field to StringLiterals
     * @param nodes of ts.Node
     * @param parent parentNode
     * @returns Array of body statements
     */
    convertBodyExpressions(nodes, parent) {
        let allowDirectives = node_utils_1.canContainDirective(parent);
        return (nodes
            .map(statement => {
            const child = this.convertChild(statement);
            if (allowDirectives) {
                if ((child === null || child === void 0 ? void 0 : child.expression) &&
                    ts.isExpressionStatement(statement) &&
                    ts.isStringLiteral(statement.expression)) {
                    const raw = child.expression.raw;
                    child.directive = raw.slice(1, -1);
                    return child; // child can be null, but it's filtered below
                }
                else {
                    allowDirectives = false;
                }
            }
            return child; // child can be null, but it's filtered below
        })
            // filter out unknown nodes for now
            .filter(statement => statement));
    }
    /**
     * Converts a ts.Node's typeArguments to TSTypeParameterInstantiation node
     * @param typeArguments ts.NodeArray typeArguments
     * @param node parent used to create this node
     * @returns TypeParameterInstantiation node
     */
    convertTypeArgumentsToTypeParameters(typeArguments, node) {
        const greaterThanToken = node_utils_1.findNextToken(typeArguments, this.ast, this.ast);
        return this.createNode(node, {
            type: ts_estree_1.AST_NODE_TYPES.TSTypeParameterInstantiation,
            range: [typeArguments.pos - 1, greaterThanToken.end],
            params: typeArguments.map(typeArgument => this.convertType(typeArgument)),
        });
    }
    /**
     * Converts a ts.Node's typeParameters to TSTypeParameterDeclaration node
     * @param typeParameters ts.Node typeParameters
     * @returns TypeParameterDeclaration node
     */
    convertTSTypeParametersToTypeParametersDeclaration(typeParameters) {
        const greaterThanToken = node_utils_1.findNextToken(typeParameters, this.ast, this.ast);
        return {
            type: ts_estree_1.AST_NODE_TYPES.TSTypeParameterDeclaration,
            range: [typeParameters.pos - 1, greaterThanToken.end],
            loc: node_utils_1.getLocFor(typeParameters.pos - 1, greaterThanToken.end, this.ast),
            params: typeParameters.map(typeParameter => this.convertType(typeParameter)),
        };
    }
    /**
     * Converts an array of ts.Node parameters into an array of ESTreeNode params
     * @param parameters An array of ts.Node params to be converted
     * @returns an array of converted ESTreeNode params
     */
    convertParameters(parameters) {
        if (!parameters || !parameters.length) {
            return [];
        }
        return parameters.map(param => {
            var _a;
            const convertedParam = this.convertChild(param);
            if ((_a = param.decorators) === null || _a === void 0 ? void 0 : _a.length) {
                convertedParam.decorators = param.decorators.map(el => this.convertChild(el));
            }
            return convertedParam;
        });
    }
    convertChainExpression(node, tsNode) {
        const { child, isOptional } = (() => {
            if (node.type === ts_estree_1.AST_NODE_TYPES.MemberExpression) {
                return { child: node.object, isOptional: node.optional };
            }
            if (node.type === ts_estree_1.AST_NODE_TYPES.CallExpression) {
                return { child: node.callee, isOptional: node.optional };
            }
            return { child: node.expression, isOptional: false };
        })();
        const isChildUnwrappable = node_utils_1.isChildUnwrappableOptionalChain(tsNode, child);
        if (!isChildUnwrappable && !isOptional) {
            return node;
        }
        if (isChildUnwrappable && node_utils_1.isChainExpression(child)) {
            // unwrap the chain expression child
            const newChild = child.expression;
            if (node.type === ts_estree_1.AST_NODE_TYPES.MemberExpression) {
                node.object = newChild;
            }
            else if (node.type === ts_estree_1.AST_NODE_TYPES.CallExpression) {
                node.callee = newChild;
            }
            else {
                node.expression = newChild;
            }
        }
        return this.createNode(tsNode, {
            type: ts_estree_1.AST_NODE_TYPES.ChainExpression,
            expression: node,
        });
    }
    /**
     * For nodes that are copied directly from the TypeScript AST into
     * ESTree mostly as-is. The only difference is the addition of a type
     * property instead of a kind property. Recursively copies all children.
     */
    deeplyCopy(node) {
        if (node.kind === ts.SyntaxKind.JSDocFunctionType) {
            throw node_utils_1.createError(this.ast, node.pos, 'JSDoc types can only be used inside documentation comments.');
        }
        const customType = `TS${SyntaxKind[node.kind]}`;
        /**
         * If the "errorOnUnknownASTType" option is set to true, throw an error,
         * otherwise fallback to just including the unknown type as-is.
         */
        if (this.options.errorOnUnknownASTType && !ts_estree_1.AST_NODE_TYPES[customType]) {
            throw new Error(`Unknown AST_NODE_TYPE: "${customType}"`);
        }
        const result = this.createNode(node, {
            type: customType,
        });
        if ('type' in node) {
            result.typeAnnotation =
                node.type && 'kind' in node.type && ts.isTypeNode(node.type)
                    ? this.convertTypeAnnotation(node.type, node)
                    : null;
        }
        if ('typeArguments' in node) {
            result.typeParameters =
                node.typeArguments && 'pos' in node.typeArguments
                    ? this.convertTypeArgumentsToTypeParameters(node.typeArguments, node)
                    : null;
        }
        if ('typeParameters' in node) {
            result.typeParameters =
                node.typeParameters && 'pos' in node.typeParameters
                    ? this.convertTSTypeParametersToTypeParametersDeclaration(node.typeParameters)
                    : null;
        }
        if ('decorators' in node && node.decorators && node.decorators.length) {
            result.decorators = node.decorators.map(el => this.convertChild(el));
        }
        Object.entries(node)
            .filter(([key]) => !/^(?:_children|kind|parent|pos|end|flags|modifierFlagsCache|jsDoc|type|typeArguments|typeParameters|decorators|transformFlags)$/.test(key))
            .forEach(([key, value]) => {
            if (Array.isArray(value)) {
                result[key] = value.map(el => this.convertChild(el));
            }
            else if (value && typeof value === 'object' && value.kind) {
                // need to check node[key].kind to ensure we don't try to convert a symbol
                result[key] = this.convertChild(value);
            }
            else {
                result[key] = value;
            }
        });
        return result;
    }
    convertJSXIdentifier(node) {
        const result = this.createNode(node, {
            type: ts_estree_1.AST_NODE_TYPES.JSXIdentifier,
            name: node.getText(),
        });
        this.registerTSNodeInNodeMap(node, result);
        return result;
    }
    convertJSXNamespaceOrIdentifier(node) {
        const text = node.getText();
        const colonIndex = text.indexOf(':');
        // this is intentional we can ignore conversion if `:` is in first character
        if (colonIndex > 0) {
            const range = node_utils_1.getRange(node, this.ast);
            const result = this.createNode(node, {
                type: ts_estree_1.AST_NODE_TYPES.JSXNamespacedName,
                namespace: this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.JSXIdentifier,
                    name: text.slice(0, colonIndex),
                    range: [range[0], range[0] + colonIndex],
                }),
                name: this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.JSXIdentifier,
                    name: text.slice(colonIndex + 1),
                    range: [range[0] + colonIndex + 1, range[1]],
                }),
                range,
            });
            this.registerTSNodeInNodeMap(node, result);
            return result;
        }
        return this.convertJSXIdentifier(node);
    }
    /**
     * Converts a TypeScript JSX node.tagName into an ESTree node.name
     * @param node the tagName object from a JSX ts.Node
     * @param parent
     * @returns the converted ESTree name object
     */
    convertJSXTagName(node, parent) {
        let result;
        switch (node.kind) {
            case SyntaxKind.PropertyAccessExpression:
                if (node.name.kind === SyntaxKind.PrivateIdentifier) {
                    // This is one of the few times where TS explicitly errors, and doesn't even gracefully handle the syntax.
                    // So we shouldn't ever get into this state to begin with.
                    throw new Error('Non-private identifier expected.');
                }
                result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.JSXMemberExpression,
                    object: this.convertJSXTagName(node.expression, parent),
                    property: this.convertJSXIdentifier(node.name),
                });
                break;
            case SyntaxKind.ThisKeyword:
            case SyntaxKind.Identifier:
            default:
                return this.convertJSXNamespaceOrIdentifier(node);
        }
        this.registerTSNodeInNodeMap(node, result);
        return result;
    }
    convertMethodSignature(node) {
        const result = this.createNode(node, {
            type: ts_estree_1.AST_NODE_TYPES.TSMethodSignature,
            computed: node_utils_1.isComputedProperty(node.name),
            key: this.convertChild(node.name),
            params: this.convertParameters(node.parameters),
            kind: (() => {
                switch (node.kind) {
                    case SyntaxKind.GetAccessor:
                        return 'get';
                    case SyntaxKind.SetAccessor:
                        return 'set';
                    case SyntaxKind.MethodSignature:
                        return 'method';
                }
            })(),
        });
        if (node_utils_1.isOptional(node)) {
            result.optional = true;
        }
        if (node.type) {
            result.returnType = this.convertTypeAnnotation(node.type, node);
        }
        if (node_utils_1.hasModifier(SyntaxKind.ReadonlyKeyword, node)) {
            result.readonly = true;
        }
        if (node.typeParameters) {
            result.typeParameters =
                this.convertTSTypeParametersToTypeParametersDeclaration(node.typeParameters);
        }
        const accessibility = node_utils_1.getTSNodeAccessibility(node);
        if (accessibility) {
            result.accessibility = accessibility;
        }
        if (node_utils_1.hasModifier(SyntaxKind.ExportKeyword, node)) {
            result.export = true;
        }
        if (node_utils_1.hasModifier(SyntaxKind.StaticKeyword, node)) {
            result.static = true;
        }
        return result;
    }
    /**
     * Applies the given TS modifiers to the given result object.
     * @param result
     * @param modifiers original ts.Nodes from the node.modifiers array
     * @returns the current result object will be mutated
     * @deprecated This method adds not standardized `modifiers` property in nodes
     */
    applyModifiersToResult(result, modifiers) {
        if (!modifiers || !modifiers.length) {
            return;
        }
        const remainingModifiers = [];
        /**
         * Some modifiers are explicitly handled by applying them as
         * boolean values on the result node. As well as adding them
         * to the result, we remove them from the array, so that they
         * are not handled twice.
         */
        for (let i = 0; i < modifiers.length; i++) {
            const modifier = modifiers[i];
            switch (modifier.kind) {
                /**
                 * Ignore ExportKeyword and DefaultKeyword, they are handled
                 * via the fixExports utility function
                 */
                case SyntaxKind.ExportKeyword:
                case SyntaxKind.DefaultKeyword:
                    break;
                case SyntaxKind.ConstKeyword:
                    result.const = true;
                    break;
                case SyntaxKind.DeclareKeyword:
                    result.declare = true;
                    break;
                default:
                    remainingModifiers.push(this.convertChild(modifier));
                    break;
            }
        }
        /**
         * If there are still valid modifiers available which have
         * not been explicitly handled above, we just convert and
         * add the modifiers array to the result node.
         */
        if (remainingModifiers.length) {
            result.modifiers = remainingModifiers;
        }
    }
    /**
     * Uses the provided range location to adjust the location data of the given Node
     * @param result The node that will have its location data mutated
     * @param childRange The child node range used to expand location
     */
    fixParentLocation(result, childRange) {
        if (childRange[0] < result.range[0]) {
            result.range[0] = childRange[0];
            result.loc.start = node_utils_1.getLineAndCharacterFor(result.range[0], this.ast);
        }
        if (childRange[1] > result.range[1]) {
            result.range[1] = childRange[1];
            result.loc.end = node_utils_1.getLineAndCharacterFor(result.range[1], this.ast);
        }
    }
    /**
     * Converts a TypeScript node into an ESTree node.
     * The core of the conversion logic:
     * Identify and convert each relevant TypeScript SyntaxKind
     * @param node the child ts.Node
     * @param parent parentNode
     * @returns the converted ESTree node
     */
    convertNode(node, parent) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        switch (node.kind) {
            case SyntaxKind.SourceFile: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.Program,
                    body: this.convertBodyExpressions(node.statements, node),
                    sourceType: node.externalModuleIndicator ? 'module' : 'script',
                    range: [node.getStart(this.ast), node.endOfFileToken.end],
                });
            }
            case SyntaxKind.Block: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.BlockStatement,
                    body: this.convertBodyExpressions(node.statements, node),
                });
            }
            case SyntaxKind.Identifier: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.Identifier,
                    name: node.text,
                });
            }
            case SyntaxKind.WithStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.WithStatement,
                    object: this.convertChild(node.expression),
                    body: this.convertChild(node.statement),
                });
            // Control Flow
            case SyntaxKind.ReturnStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ReturnStatement,
                    argument: this.convertChild(node.expression),
                });
            case SyntaxKind.LabeledStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.LabeledStatement,
                    label: this.convertChild(node.label),
                    body: this.convertChild(node.statement),
                });
            case SyntaxKind.ContinueStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ContinueStatement,
                    label: this.convertChild(node.label),
                });
            case SyntaxKind.BreakStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.BreakStatement,
                    label: this.convertChild(node.label),
                });
            // Choice
            case SyntaxKind.IfStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.IfStatement,
                    test: this.convertChild(node.expression),
                    consequent: this.convertChild(node.thenStatement),
                    alternate: this.convertChild(node.elseStatement),
                });
            case SyntaxKind.SwitchStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.SwitchStatement,
                    discriminant: this.convertChild(node.expression),
                    cases: node.caseBlock.clauses.map(el => this.convertChild(el)),
                });
            case SyntaxKind.CaseClause:
            case SyntaxKind.DefaultClause:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.SwitchCase,
                    // expression is present in case only
                    test: node.kind === SyntaxKind.CaseClause
                        ? this.convertChild(node.expression)
                        : null,
                    consequent: node.statements.map(el => this.convertChild(el)),
                });
            // Exceptions
            case SyntaxKind.ThrowStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ThrowStatement,
                    argument: this.convertChild(node.expression),
                });
            case SyntaxKind.TryStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TryStatement,
                    block: this.convertChild(node.tryBlock),
                    handler: this.convertChild(node.catchClause),
                    finalizer: this.convertChild(node.finallyBlock),
                });
            case SyntaxKind.CatchClause:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.CatchClause,
                    param: node.variableDeclaration
                        ? this.convertBindingNameWithTypeAnnotation(node.variableDeclaration.name, node.variableDeclaration.type)
                        : null,
                    body: this.convertChild(node.block),
                });
            // Loops
            case SyntaxKind.WhileStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.WhileStatement,
                    test: this.convertChild(node.expression),
                    body: this.convertChild(node.statement),
                });
            /**
             * Unlike other parsers, TypeScript calls a "DoWhileStatement"
             * a "DoStatement"
             */
            case SyntaxKind.DoStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.DoWhileStatement,
                    test: this.convertChild(node.expression),
                    body: this.convertChild(node.statement),
                });
            case SyntaxKind.ForStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ForStatement,
                    init: this.convertChild(node.initializer),
                    test: this.convertChild(node.condition),
                    update: this.convertChild(node.incrementor),
                    body: this.convertChild(node.statement),
                });
            case SyntaxKind.ForInStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ForInStatement,
                    left: this.convertPattern(node.initializer),
                    right: this.convertChild(node.expression),
                    body: this.convertChild(node.statement),
                });
            case SyntaxKind.ForOfStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ForOfStatement,
                    left: this.convertPattern(node.initializer),
                    right: this.convertChild(node.expression),
                    body: this.convertChild(node.statement),
                    await: Boolean(node.awaitModifier &&
                        node.awaitModifier.kind === SyntaxKind.AwaitKeyword),
                });
            // Declarations
            case SyntaxKind.FunctionDeclaration: {
                const isDeclare = node_utils_1.hasModifier(SyntaxKind.DeclareKeyword, node);
                const result = this.createNode(node, {
                    type: isDeclare || !node.body
                        ? ts_estree_1.AST_NODE_TYPES.TSDeclareFunction
                        : ts_estree_1.AST_NODE_TYPES.FunctionDeclaration,
                    id: this.convertChild(node.name),
                    generator: !!node.asteriskToken,
                    expression: false,
                    async: node_utils_1.hasModifier(SyntaxKind.AsyncKeyword, node),
                    params: this.convertParameters(node.parameters),
                    body: this.convertChild(node.body) || undefined,
                });
                // Process returnType
                if (node.type) {
                    result.returnType = this.convertTypeAnnotation(node.type, node);
                }
                if (isDeclare) {
                    result.declare = true;
                }
                // Process typeParameters
                if (node.typeParameters) {
                    result.typeParameters =
                        this.convertTSTypeParametersToTypeParametersDeclaration(node.typeParameters);
                }
                // check for exports
                return this.fixExports(node, result);
            }
            case SyntaxKind.VariableDeclaration: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.VariableDeclarator,
                    id: this.convertBindingNameWithTypeAnnotation(node.name, node.type, node),
                    init: this.convertChild(node.initializer),
                });
                if (node.exclamationToken) {
                    result.definite = true;
                }
                return result;
            }
            case SyntaxKind.VariableStatement: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.VariableDeclaration,
                    declarations: node.declarationList.declarations.map(el => this.convertChild(el)),
                    kind: node_utils_1.getDeclarationKind(node.declarationList),
                });
                /**
                 * Semantically, decorators are not allowed on variable declarations,
                 * but the TypeScript compiler will parse them and produce a valid AST,
                 * so we handle them here too.
                 */
                if (node.decorators) {
                    result.decorators = node.decorators.map(el => this.convertChild(el));
                }
                if (node_utils_1.hasModifier(SyntaxKind.DeclareKeyword, node)) {
                    result.declare = true;
                }
                // check for exports
                return this.fixExports(node, result);
            }
            // mostly for for-of, for-in
            case SyntaxKind.VariableDeclarationList:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.VariableDeclaration,
                    declarations: node.declarations.map(el => this.convertChild(el)),
                    kind: node_utils_1.getDeclarationKind(node),
                });
            // Expressions
            case SyntaxKind.ExpressionStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ExpressionStatement,
                    expression: this.convertChild(node.expression),
                });
            case SyntaxKind.ThisKeyword:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ThisExpression,
                });
            case SyntaxKind.ArrayLiteralExpression: {
                // TypeScript uses ArrayLiteralExpression in destructuring assignment, too
                if (this.allowPattern) {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.ArrayPattern,
                        elements: node.elements.map(el => this.convertPattern(el)),
                    });
                }
                else {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.ArrayExpression,
                        elements: node.elements.map(el => this.convertChild(el)),
                    });
                }
            }
            case SyntaxKind.ObjectLiteralExpression: {
                // TypeScript uses ObjectLiteralExpression in destructuring assignment, too
                if (this.allowPattern) {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.ObjectPattern,
                        properties: node.properties.map(el => this.convertPattern(el)),
                    });
                }
                else {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.ObjectExpression,
                        properties: node.properties.map(el => this.convertChild(el)),
                    });
                }
            }
            case SyntaxKind.PropertyAssignment:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.Property,
                    key: this.convertChild(node.name),
                    value: this.converter(node.initializer, node, this.inTypeMode, this.allowPattern),
                    computed: node_utils_1.isComputedProperty(node.name),
                    method: false,
                    shorthand: false,
                    kind: 'init',
                });
            case SyntaxKind.ShorthandPropertyAssignment: {
                if (node.objectAssignmentInitializer) {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.Property,
                        key: this.convertChild(node.name),
                        value: this.createNode(node, {
                            type: ts_estree_1.AST_NODE_TYPES.AssignmentPattern,
                            left: this.convertPattern(node.name),
                            right: this.convertChild(node.objectAssignmentInitializer),
                        }),
                        computed: false,
                        method: false,
                        shorthand: true,
                        kind: 'init',
                    });
                }
                else {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.Property,
                        key: this.convertChild(node.name),
                        value: this.convertChild(node.name),
                        computed: false,
                        method: false,
                        shorthand: true,
                        kind: 'init',
                    });
                }
            }
            case SyntaxKind.ComputedPropertyName:
                return this.convertChild(node.expression);
            case SyntaxKind.PropertyDeclaration: {
                const isAbstract = node_utils_1.hasModifier(SyntaxKind.AbstractKeyword, node);
                const result = this.createNode(node, {
                    type: isAbstract
                        ? ts_estree_1.AST_NODE_TYPES.TSAbstractClassProperty
                        : ts_estree_1.AST_NODE_TYPES.ClassProperty,
                    key: this.convertChild(node.name),
                    value: this.convertChild(node.initializer),
                    computed: node_utils_1.isComputedProperty(node.name),
                    static: node_utils_1.hasModifier(SyntaxKind.StaticKeyword, node),
                    readonly: node_utils_1.hasModifier(SyntaxKind.ReadonlyKeyword, node) || undefined,
                    declare: node_utils_1.hasModifier(SyntaxKind.DeclareKeyword, node),
                    override: node_utils_1.hasModifier(SyntaxKind.OverrideKeyword, node),
                });
                if (node.type) {
                    result.typeAnnotation = this.convertTypeAnnotation(node.type, node);
                }
                if (node.decorators) {
                    result.decorators = node.decorators.map(el => this.convertChild(el));
                }
                const accessibility = node_utils_1.getTSNodeAccessibility(node);
                if (accessibility) {
                    result.accessibility = accessibility;
                }
                if ((node.name.kind === SyntaxKind.Identifier ||
                    node.name.kind === SyntaxKind.ComputedPropertyName) &&
                    node.questionToken) {
                    result.optional = true;
                }
                if (node.exclamationToken) {
                    result.definite = true;
                }
                if (result.key.type === ts_estree_1.AST_NODE_TYPES.Literal && node.questionToken) {
                    result.optional = true;
                }
                return result;
            }
            case SyntaxKind.GetAccessor:
            case SyntaxKind.SetAccessor: {
                if (node.parent.kind === SyntaxKind.InterfaceDeclaration ||
                    node.parent.kind === SyntaxKind.TypeLiteral) {
                    return this.convertMethodSignature(node);
                }
            }
            // otherwise, it is a non-type accessor - intentional fallthrough
            case SyntaxKind.MethodDeclaration: {
                const method = this.createNode(node, {
                    type: !node.body
                        ? ts_estree_1.AST_NODE_TYPES.TSEmptyBodyFunctionExpression
                        : ts_estree_1.AST_NODE_TYPES.FunctionExpression,
                    id: null,
                    generator: !!node.asteriskToken,
                    expression: false,
                    async: node_utils_1.hasModifier(SyntaxKind.AsyncKeyword, node),
                    body: this.convertChild(node.body),
                    range: [node.parameters.pos - 1, node.end],
                    params: [],
                });
                if (node.type) {
                    method.returnType = this.convertTypeAnnotation(node.type, node);
                }
                // Process typeParameters
                if (node.typeParameters) {
                    method.typeParameters =
                        this.convertTSTypeParametersToTypeParametersDeclaration(node.typeParameters);
                    this.fixParentLocation(method, method.typeParameters.range);
                }
                let result;
                if (parent.kind === SyntaxKind.ObjectLiteralExpression) {
                    method.params = node.parameters.map(el => this.convertChild(el));
                    result = this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.Property,
                        key: this.convertChild(node.name),
                        value: method,
                        computed: node_utils_1.isComputedProperty(node.name),
                        method: node.kind === SyntaxKind.MethodDeclaration,
                        shorthand: false,
                        kind: 'init',
                    });
                }
                else {
                    // class
                    /**
                     * Unlike in object literal methods, class method params can have decorators
                     */
                    method.params = this.convertParameters(node.parameters);
                    /**
                     * TypeScript class methods can be defined as "abstract"
                     */
                    const methodDefinitionType = node_utils_1.hasModifier(SyntaxKind.AbstractKeyword, node)
                        ? ts_estree_1.AST_NODE_TYPES.TSAbstractMethodDefinition
                        : ts_estree_1.AST_NODE_TYPES.MethodDefinition;
                    result = this.createNode(node, {
                        type: methodDefinitionType,
                        key: this.convertChild(node.name),
                        value: method,
                        computed: node_utils_1.isComputedProperty(node.name),
                        static: node_utils_1.hasModifier(SyntaxKind.StaticKeyword, node),
                        kind: 'method',
                        override: node_utils_1.hasModifier(SyntaxKind.OverrideKeyword, node),
                    });
                    if (node.decorators) {
                        result.decorators = node.decorators.map(el => this.convertChild(el));
                    }
                    const accessibility = node_utils_1.getTSNodeAccessibility(node);
                    if (accessibility) {
                        result.accessibility = accessibility;
                    }
                }
                if (node.questionToken) {
                    result.optional = true;
                }
                if (node.kind === SyntaxKind.GetAccessor) {
                    result.kind = 'get';
                }
                else if (node.kind === SyntaxKind.SetAccessor) {
                    result.kind = 'set';
                }
                else if (!result.static &&
                    node.name.kind === SyntaxKind.StringLiteral &&
                    node.name.text === 'constructor' &&
                    result.type !== ts_estree_1.AST_NODE_TYPES.Property) {
                    result.kind = 'constructor';
                }
                return result;
            }
            // TypeScript uses this even for static methods named "constructor"
            case SyntaxKind.Constructor: {
                const lastModifier = node_utils_1.getLastModifier(node);
                const constructorToken = (lastModifier && node_utils_1.findNextToken(lastModifier, node, this.ast)) ||
                    node.getFirstToken();
                const constructor = this.createNode(node, {
                    type: !node.body
                        ? ts_estree_1.AST_NODE_TYPES.TSEmptyBodyFunctionExpression
                        : ts_estree_1.AST_NODE_TYPES.FunctionExpression,
                    id: null,
                    params: this.convertParameters(node.parameters),
                    generator: false,
                    expression: false,
                    async: false,
                    body: this.convertChild(node.body),
                    range: [node.parameters.pos - 1, node.end],
                });
                // Process typeParameters
                if (node.typeParameters) {
                    constructor.typeParameters =
                        this.convertTSTypeParametersToTypeParametersDeclaration(node.typeParameters);
                    this.fixParentLocation(constructor, constructor.typeParameters.range);
                }
                // Process returnType
                if (node.type) {
                    constructor.returnType = this.convertTypeAnnotation(node.type, node);
                }
                const constructorKey = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.Identifier,
                    name: 'constructor',
                    range: [constructorToken.getStart(this.ast), constructorToken.end],
                });
                const isStatic = node_utils_1.hasModifier(SyntaxKind.StaticKeyword, node);
                const result = this.createNode(node, {
                    type: node_utils_1.hasModifier(SyntaxKind.AbstractKeyword, node)
                        ? ts_estree_1.AST_NODE_TYPES.TSAbstractMethodDefinition
                        : ts_estree_1.AST_NODE_TYPES.MethodDefinition,
                    key: constructorKey,
                    value: constructor,
                    computed: false,
                    static: isStatic,
                    kind: isStatic ? 'method' : 'constructor',
                    override: false,
                });
                const accessibility = node_utils_1.getTSNodeAccessibility(node);
                if (accessibility) {
                    result.accessibility = accessibility;
                }
                return result;
            }
            case SyntaxKind.FunctionExpression: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.FunctionExpression,
                    id: this.convertChild(node.name),
                    generator: !!node.asteriskToken,
                    params: this.convertParameters(node.parameters),
                    body: this.convertChild(node.body),
                    async: node_utils_1.hasModifier(SyntaxKind.AsyncKeyword, node),
                    expression: false,
                });
                // Process returnType
                if (node.type) {
                    result.returnType = this.convertTypeAnnotation(node.type, node);
                }
                // Process typeParameters
                if (node.typeParameters) {
                    result.typeParameters =
                        this.convertTSTypeParametersToTypeParametersDeclaration(node.typeParameters);
                }
                return result;
            }
            case SyntaxKind.SuperKeyword:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.Super,
                });
            case SyntaxKind.ArrayBindingPattern:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ArrayPattern,
                    elements: node.elements.map(el => this.convertPattern(el)),
                });
            // occurs with missing array elements like [,]
            case SyntaxKind.OmittedExpression:
                return null;
            case SyntaxKind.ObjectBindingPattern:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ObjectPattern,
                    properties: node.elements.map(el => this.convertPattern(el)),
                });
            case SyntaxKind.BindingElement: {
                if (parent.kind === SyntaxKind.ArrayBindingPattern) {
                    const arrayItem = this.convertChild(node.name, parent);
                    if (node.initializer) {
                        return this.createNode(node, {
                            type: ts_estree_1.AST_NODE_TYPES.AssignmentPattern,
                            left: arrayItem,
                            right: this.convertChild(node.initializer),
                        });
                    }
                    else if (node.dotDotDotToken) {
                        return this.createNode(node, {
                            type: ts_estree_1.AST_NODE_TYPES.RestElement,
                            argument: arrayItem,
                        });
                    }
                    else {
                        return arrayItem;
                    }
                }
                else {
                    let result;
                    if (node.dotDotDotToken) {
                        result = this.createNode(node, {
                            type: ts_estree_1.AST_NODE_TYPES.RestElement,
                            argument: this.convertChild((_a = node.propertyName) !== null && _a !== void 0 ? _a : node.name),
                        });
                    }
                    else {
                        result = this.createNode(node, {
                            type: ts_estree_1.AST_NODE_TYPES.Property,
                            key: this.convertChild((_b = node.propertyName) !== null && _b !== void 0 ? _b : node.name),
                            value: this.convertChild(node.name),
                            computed: Boolean(node.propertyName &&
                                node.propertyName.kind === SyntaxKind.ComputedPropertyName),
                            method: false,
                            shorthand: !node.propertyName,
                            kind: 'init',
                        });
                    }
                    if (node.initializer) {
                        result.value = this.createNode(node, {
                            type: ts_estree_1.AST_NODE_TYPES.AssignmentPattern,
                            left: this.convertChild(node.name),
                            right: this.convertChild(node.initializer),
                            range: [node.name.getStart(this.ast), node.initializer.end],
                        });
                    }
                    return result;
                }
            }
            case SyntaxKind.ArrowFunction: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ArrowFunctionExpression,
                    generator: false,
                    id: null,
                    params: this.convertParameters(node.parameters),
                    body: this.convertChild(node.body),
                    async: node_utils_1.hasModifier(SyntaxKind.AsyncKeyword, node),
                    expression: node.body.kind !== SyntaxKind.Block,
                });
                // Process returnType
                if (node.type) {
                    result.returnType = this.convertTypeAnnotation(node.type, node);
                }
                // Process typeParameters
                if (node.typeParameters) {
                    result.typeParameters =
                        this.convertTSTypeParametersToTypeParametersDeclaration(node.typeParameters);
                }
                return result;
            }
            case SyntaxKind.YieldExpression:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.YieldExpression,
                    delegate: !!node.asteriskToken,
                    argument: this.convertChild(node.expression),
                });
            case SyntaxKind.AwaitExpression:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.AwaitExpression,
                    argument: this.convertChild(node.expression),
                });
            // Template Literals
            case SyntaxKind.NoSubstitutionTemplateLiteral:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TemplateLiteral,
                    quasis: [
                        this.createNode(node, {
                            type: ts_estree_1.AST_NODE_TYPES.TemplateElement,
                            value: {
                                raw: this.ast.text.slice(node.getStart(this.ast) + 1, node.end - 1),
                                cooked: node.text,
                            },
                            tail: true,
                        }),
                    ],
                    expressions: [],
                });
            case SyntaxKind.TemplateExpression: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TemplateLiteral,
                    quasis: [this.convertChild(node.head)],
                    expressions: [],
                });
                node.templateSpans.forEach(templateSpan => {
                    result.expressions.push(this.convertChild(templateSpan.expression));
                    result.quasis.push(this.convertChild(templateSpan.literal));
                });
                return result;
            }
            case SyntaxKind.TaggedTemplateExpression:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TaggedTemplateExpression,
                    typeParameters: node.typeArguments
                        ? this.convertTypeArgumentsToTypeParameters(node.typeArguments, node)
                        : undefined,
                    tag: this.convertChild(node.tag),
                    quasi: this.convertChild(node.template),
                });
            case SyntaxKind.TemplateHead:
            case SyntaxKind.TemplateMiddle:
            case SyntaxKind.TemplateTail: {
                const tail = node.kind === SyntaxKind.TemplateTail;
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TemplateElement,
                    value: {
                        raw: this.ast.text.slice(node.getStart(this.ast) + 1, node.end - (tail ? 1 : 2)),
                        cooked: node.text,
                    },
                    tail,
                });
            }
            // Patterns
            case SyntaxKind.SpreadAssignment:
            case SyntaxKind.SpreadElement: {
                if (this.allowPattern) {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.RestElement,
                        argument: this.convertPattern(node.expression),
                    });
                }
                else {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.SpreadElement,
                        argument: this.convertChild(node.expression),
                    });
                }
            }
            case SyntaxKind.Parameter: {
                let parameter;
                let result;
                if (node.dotDotDotToken) {
                    parameter = result = this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.RestElement,
                        argument: this.convertChild(node.name),
                    });
                }
                else if (node.initializer) {
                    parameter = this.convertChild(node.name);
                    result = this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.AssignmentPattern,
                        left: parameter,
                        right: this.convertChild(node.initializer),
                    });
                    if (node.modifiers) {
                        // AssignmentPattern should not contain modifiers in range
                        result.range[0] = parameter.range[0];
                        result.loc = node_utils_1.getLocFor(result.range[0], result.range[1], this.ast);
                    }
                }
                else {
                    parameter = result = this.convertChild(node.name, parent);
                }
                if (node.type) {
                    parameter.typeAnnotation = this.convertTypeAnnotation(node.type, node);
                    this.fixParentLocation(parameter, parameter.typeAnnotation.range);
                }
                if (node.questionToken) {
                    if (node.questionToken.end > parameter.range[1]) {
                        parameter.range[1] = node.questionToken.end;
                        parameter.loc.end = node_utils_1.getLineAndCharacterFor(parameter.range[1], this.ast);
                    }
                    parameter.optional = true;
                }
                if (node.modifiers) {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.TSParameterProperty,
                        accessibility: (_c = node_utils_1.getTSNodeAccessibility(node)) !== null && _c !== void 0 ? _c : undefined,
                        readonly: node_utils_1.hasModifier(SyntaxKind.ReadonlyKeyword, node) || undefined,
                        static: node_utils_1.hasModifier(SyntaxKind.StaticKeyword, node) || undefined,
                        export: node_utils_1.hasModifier(SyntaxKind.ExportKeyword, node) || undefined,
                        override: node_utils_1.hasModifier(SyntaxKind.OverrideKeyword, node) || undefined,
                        parameter: result,
                    });
                }
                return result;
            }
            // Classes
            case SyntaxKind.ClassDeclaration:
            case SyntaxKind.ClassExpression: {
                const heritageClauses = (_d = node.heritageClauses) !== null && _d !== void 0 ? _d : [];
                const classNodeType = node.kind === SyntaxKind.ClassDeclaration
                    ? ts_estree_1.AST_NODE_TYPES.ClassDeclaration
                    : ts_estree_1.AST_NODE_TYPES.ClassExpression;
                const superClass = heritageClauses.find(clause => clause.token === SyntaxKind.ExtendsKeyword);
                const implementsClause = heritageClauses.find(clause => clause.token === SyntaxKind.ImplementsKeyword);
                const result = this.createNode(node, {
                    type: classNodeType,
                    id: this.convertChild(node.name),
                    body: this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.ClassBody,
                        body: [],
                        range: [node.members.pos - 1, node.end],
                    }),
                    superClass: (superClass === null || superClass === void 0 ? void 0 : superClass.types[0])
                        ? this.convertChild(superClass.types[0].expression)
                        : null,
                });
                if (superClass) {
                    if (superClass.types.length > 1) {
                        throw node_utils_1.createError(this.ast, superClass.types[1].pos, 'Classes can only extend a single class.');
                    }
                    if ((_e = superClass.types[0]) === null || _e === void 0 ? void 0 : _e.typeArguments) {
                        result.superTypeParameters =
                            this.convertTypeArgumentsToTypeParameters(superClass.types[0].typeArguments, superClass.types[0]);
                    }
                }
                if (node.typeParameters) {
                    result.typeParameters =
                        this.convertTSTypeParametersToTypeParametersDeclaration(node.typeParameters);
                }
                if (implementsClause) {
                    result.implements = implementsClause.types.map(el => this.convertChild(el));
                }
                /**
                 * TypeScript class declarations can be defined as "abstract"
                 */
                if (node_utils_1.hasModifier(SyntaxKind.AbstractKeyword, node)) {
                    result.abstract = true;
                }
                if (node_utils_1.hasModifier(SyntaxKind.DeclareKeyword, node)) {
                    result.declare = true;
                }
                if (node.decorators) {
                    result.decorators = node.decorators.map(el => this.convertChild(el));
                }
                const filteredMembers = node.members.filter(node_utils_1.isESTreeClassMember);
                if (filteredMembers.length) {
                    result.body.body = filteredMembers.map(el => this.convertChild(el));
                }
                // check for exports
                return this.fixExports(node, result);
            }
            // Modules
            case SyntaxKind.ModuleBlock:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSModuleBlock,
                    body: this.convertBodyExpressions(node.statements, node),
                });
            case SyntaxKind.ImportDeclaration: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ImportDeclaration,
                    source: this.convertChild(node.moduleSpecifier),
                    specifiers: [],
                    importKind: 'value',
                });
                if (node.importClause) {
                    if (node.importClause.isTypeOnly) {
                        result.importKind = 'type';
                    }
                    if (node.importClause.name) {
                        result.specifiers.push(this.convertChild(node.importClause));
                    }
                    if (node.importClause.namedBindings) {
                        switch (node.importClause.namedBindings.kind) {
                            case SyntaxKind.NamespaceImport:
                                result.specifiers.push(this.convertChild(node.importClause.namedBindings));
                                break;
                            case SyntaxKind.NamedImports:
                                result.specifiers = result.specifiers.concat(node.importClause.namedBindings.elements.map(el => this.convertChild(el)));
                                break;
                        }
                    }
                }
                return result;
            }
            case SyntaxKind.NamespaceImport:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ImportNamespaceSpecifier,
                    local: this.convertChild(node.name),
                });
            case SyntaxKind.ImportSpecifier:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ImportSpecifier,
                    local: this.convertChild(node.name),
                    imported: this.convertChild((_f = node.propertyName) !== null && _f !== void 0 ? _f : node.name),
                });
            case SyntaxKind.ImportClause: {
                const local = this.convertChild(node.name);
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ImportDefaultSpecifier,
                    local,
                    range: local.range,
                });
            }
            case SyntaxKind.ExportDeclaration:
                if (((_g = node.exportClause) === null || _g === void 0 ? void 0 : _g.kind) === SyntaxKind.NamedExports) {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.ExportNamedDeclaration,
                        source: this.convertChild(node.moduleSpecifier),
                        specifiers: node.exportClause.elements.map(el => this.convertChild(el)),
                        exportKind: node.isTypeOnly ? 'type' : 'value',
                        declaration: null,
                    });
                }
                else {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.ExportAllDeclaration,
                        source: this.convertChild(node.moduleSpecifier),
                        exportKind: node.isTypeOnly ? 'type' : 'value',
                        exported: 
                        // note - for compat with 3.7.x, where node.exportClause is always undefined and
                        //        SyntaxKind.NamespaceExport does not exist yet (i.e. is undefined), this
                        //        cannot be shortened to an optional chain, or else you end up with
                        //        undefined === undefined, and the true path will hard error at runtime
                        node.exportClause &&
                            node.exportClause.kind === SyntaxKind.NamespaceExport
                            ? this.convertChild(node.exportClause.name)
                            : null,
                    });
                }
            case SyntaxKind.ExportSpecifier:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ExportSpecifier,
                    local: this.convertChild((_h = node.propertyName) !== null && _h !== void 0 ? _h : node.name),
                    exported: this.convertChild(node.name),
                });
            case SyntaxKind.ExportAssignment:
                if (node.isExportEquals) {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.TSExportAssignment,
                        expression: this.convertChild(node.expression),
                    });
                }
                else {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.ExportDefaultDeclaration,
                        declaration: this.convertChild(node.expression),
                        exportKind: 'value',
                    });
                }
            // Unary Operations
            case SyntaxKind.PrefixUnaryExpression:
            case SyntaxKind.PostfixUnaryExpression: {
                const operator = node_utils_1.getTextForTokenKind(node.operator);
                /**
                 * ESTree uses UpdateExpression for ++/--
                 */
                if (operator === '++' || operator === '--') {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.UpdateExpression,
                        operator,
                        prefix: node.kind === SyntaxKind.PrefixUnaryExpression,
                        argument: this.convertChild(node.operand),
                    });
                }
                else {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.UnaryExpression,
                        operator,
                        prefix: node.kind === SyntaxKind.PrefixUnaryExpression,
                        argument: this.convertChild(node.operand),
                    });
                }
            }
            case SyntaxKind.DeleteExpression:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.UnaryExpression,
                    operator: 'delete',
                    prefix: true,
                    argument: this.convertChild(node.expression),
                });
            case SyntaxKind.VoidExpression:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.UnaryExpression,
                    operator: 'void',
                    prefix: true,
                    argument: this.convertChild(node.expression),
                });
            case SyntaxKind.TypeOfExpression:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.UnaryExpression,
                    operator: 'typeof',
                    prefix: true,
                    argument: this.convertChild(node.expression),
                });
            case SyntaxKind.TypeOperator:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSTypeOperator,
                    operator: node_utils_1.getTextForTokenKind(node.operator),
                    typeAnnotation: this.convertChild(node.type),
                });
            // Binary Operations
            case SyntaxKind.BinaryExpression: {
                // TypeScript uses BinaryExpression for sequences as well
                if (node_utils_1.isComma(node.operatorToken)) {
                    const result = this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.SequenceExpression,
                        expressions: [],
                    });
                    const left = this.convertChild(node.left);
                    if (left.type === ts_estree_1.AST_NODE_TYPES.SequenceExpression &&
                        node.left.kind !== SyntaxKind.ParenthesizedExpression) {
                        result.expressions = result.expressions.concat(left.expressions);
                    }
                    else {
                        result.expressions.push(left);
                    }
                    result.expressions.push(this.convertChild(node.right));
                    return result;
                }
                else {
                    const type = node_utils_1.getBinaryExpressionType(node.operatorToken);
                    if (this.allowPattern &&
                        type === ts_estree_1.AST_NODE_TYPES.AssignmentExpression) {
                        return this.createNode(node, {
                            type: ts_estree_1.AST_NODE_TYPES.AssignmentPattern,
                            left: this.convertPattern(node.left, node),
                            right: this.convertChild(node.right),
                        });
                    }
                    return this.createNode(node, {
                        type,
                        operator: node_utils_1.getTextForTokenKind(node.operatorToken.kind),
                        left: this.converter(node.left, node, this.inTypeMode, type === ts_estree_1.AST_NODE_TYPES.AssignmentExpression),
                        right: this.convertChild(node.right),
                    });
                }
            }
            case SyntaxKind.PropertyAccessExpression: {
                const object = this.convertChild(node.expression);
                const property = this.convertChild(node.name);
                const computed = false;
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.MemberExpression,
                    object,
                    property,
                    computed,
                    optional: node.questionDotToken !== undefined,
                });
                return this.convertChainExpression(result, node);
            }
            case SyntaxKind.ElementAccessExpression: {
                const object = this.convertChild(node.expression);
                const property = this.convertChild(node.argumentExpression);
                const computed = true;
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.MemberExpression,
                    object,
                    property,
                    computed,
                    optional: node.questionDotToken !== undefined,
                });
                return this.convertChainExpression(result, node);
            }
            case SyntaxKind.CallExpression: {
                if (node.expression.kind === SyntaxKind.ImportKeyword) {
                    if (node.arguments.length !== 1) {
                        throw node_utils_1.createError(this.ast, node.arguments.pos, 'Dynamic import must have one specifier as an argument.');
                    }
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.ImportExpression,
                        source: this.convertChild(node.arguments[0]),
                    });
                }
                const callee = this.convertChild(node.expression);
                const args = node.arguments.map(el => this.convertChild(el));
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.CallExpression,
                    callee,
                    arguments: args,
                    optional: node.questionDotToken !== undefined,
                });
                if (node.typeArguments) {
                    result.typeParameters = this.convertTypeArgumentsToTypeParameters(node.typeArguments, node);
                }
                return this.convertChainExpression(result, node);
            }
            case SyntaxKind.NewExpression: {
                // NOTE - NewExpression cannot have an optional chain in it
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.NewExpression,
                    callee: this.convertChild(node.expression),
                    arguments: node.arguments
                        ? node.arguments.map(el => this.convertChild(el))
                        : [],
                });
                if (node.typeArguments) {
                    result.typeParameters = this.convertTypeArgumentsToTypeParameters(node.typeArguments, node);
                }
                return result;
            }
            case SyntaxKind.ConditionalExpression:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.ConditionalExpression,
                    test: this.convertChild(node.condition),
                    consequent: this.convertChild(node.whenTrue),
                    alternate: this.convertChild(node.whenFalse),
                });
            case SyntaxKind.MetaProperty: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.MetaProperty,
                    meta: this.createNode(
                    // TODO: do we really want to convert it to Token?
                    node.getFirstToken(), {
                        type: ts_estree_1.AST_NODE_TYPES.Identifier,
                        name: node_utils_1.getTextForTokenKind(node.keywordToken),
                    }),
                    property: this.convertChild(node.name),
                });
            }
            case SyntaxKind.Decorator: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.Decorator,
                    expression: this.convertChild(node.expression),
                });
            }
            // Literals
            case SyntaxKind.StringLiteral: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.Literal,
                    value: parent.kind === SyntaxKind.JsxAttribute
                        ? node_utils_1.unescapeStringLiteralText(node.text)
                        : node.text,
                    raw: node.getText(),
                });
            }
            case SyntaxKind.NumericLiteral: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.Literal,
                    value: Number(node.text),
                    raw: node.getText(),
                });
            }
            case SyntaxKind.BigIntLiteral: {
                const range = node_utils_1.getRange(node, this.ast);
                const rawValue = this.ast.text.slice(range[0], range[1]);
                const bigint = rawValue
                    // remove suffix `n`
                    .slice(0, -1)
                    // `BigInt` doesn't accept numeric separator
                    // and `bigint` property should not include numeric separator
                    .replace(/_/g, '');
                const value = typeof BigInt !== 'undefined' ? BigInt(bigint) : null;
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.Literal,
                    raw: rawValue,
                    value: value,
                    bigint: value === null ? bigint : String(value),
                    range,
                });
            }
            case SyntaxKind.RegularExpressionLiteral: {
                const pattern = node.text.slice(1, node.text.lastIndexOf('/'));
                const flags = node.text.slice(node.text.lastIndexOf('/') + 1);
                let regex = null;
                try {
                    regex = new RegExp(pattern, flags);
                }
                catch (exception) {
                    regex = null;
                }
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.Literal,
                    value: regex,
                    raw: node.text,
                    regex: {
                        pattern,
                        flags,
                    },
                });
            }
            case SyntaxKind.TrueKeyword:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.Literal,
                    value: true,
                    raw: 'true',
                });
            case SyntaxKind.FalseKeyword:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.Literal,
                    value: false,
                    raw: 'false',
                });
            case SyntaxKind.NullKeyword: {
                if (!version_check_1.typescriptVersionIsAtLeast['4.0'] && this.inTypeMode) {
                    // 4.0 started nesting null types inside a LiteralType node, but we still need to support pre-4.0
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.TSNullKeyword,
                    });
                }
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.Literal,
                    value: null,
                    raw: 'null',
                });
            }
            case SyntaxKind.EmptyStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.EmptyStatement,
                });
            case SyntaxKind.DebuggerStatement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.DebuggerStatement,
                });
            // JSX
            case SyntaxKind.JsxElement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.JSXElement,
                    openingElement: this.convertChild(node.openingElement),
                    closingElement: this.convertChild(node.closingElement),
                    children: node.children.map(el => this.convertChild(el)),
                });
            case SyntaxKind.JsxFragment:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.JSXFragment,
                    openingFragment: this.convertChild(node.openingFragment),
                    closingFragment: this.convertChild(node.closingFragment),
                    children: node.children.map(el => this.convertChild(el)),
                });
            case SyntaxKind.JsxSelfClosingElement: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.JSXElement,
                    /**
                     * Convert SyntaxKind.JsxSelfClosingElement to SyntaxKind.JsxOpeningElement,
                     * TypeScript does not seem to have the idea of openingElement when tag is self-closing
                     */
                    openingElement: this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.JSXOpeningElement,
                        typeParameters: node.typeArguments
                            ? this.convertTypeArgumentsToTypeParameters(node.typeArguments, node)
                            : undefined,
                        selfClosing: true,
                        name: this.convertJSXTagName(node.tagName, node),
                        attributes: node.attributes.properties.map(el => this.convertChild(el)),
                        range: node_utils_1.getRange(node, this.ast),
                    }),
                    closingElement: null,
                    children: [],
                });
            }
            case SyntaxKind.JsxOpeningElement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.JSXOpeningElement,
                    typeParameters: node.typeArguments
                        ? this.convertTypeArgumentsToTypeParameters(node.typeArguments, node)
                        : undefined,
                    selfClosing: false,
                    name: this.convertJSXTagName(node.tagName, node),
                    attributes: node.attributes.properties.map(el => this.convertChild(el)),
                });
            case SyntaxKind.JsxClosingElement:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.JSXClosingElement,
                    name: this.convertJSXTagName(node.tagName, node),
                });
            case SyntaxKind.JsxOpeningFragment:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.JSXOpeningFragment,
                });
            case SyntaxKind.JsxClosingFragment:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.JSXClosingFragment,
                });
            case SyntaxKind.JsxExpression: {
                const expression = node.expression
                    ? this.convertChild(node.expression)
                    : this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.JSXEmptyExpression,
                        range: [node.getStart(this.ast) + 1, node.getEnd() - 1],
                    });
                if (node.dotDotDotToken) {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.JSXSpreadChild,
                        expression,
                    });
                }
                else {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.JSXExpressionContainer,
                        expression,
                    });
                }
            }
            case SyntaxKind.JsxAttribute: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.JSXAttribute,
                    name: this.convertJSXNamespaceOrIdentifier(node.name),
                    value: this.convertChild(node.initializer),
                });
            }
            /**
             * The JSX AST changed the node type for string literals
             * inside a JSX Element from `Literal` to `JSXText`. We
             * provide a flag to support both types until `Literal`
             * node type is deprecated in ESLint v5.
             */
            case SyntaxKind.JsxText: {
                const start = node.getFullStart();
                const end = node.getEnd();
                const text = this.ast.text.slice(start, end);
                if (this.options.useJSXTextNode) {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.JSXText,
                        value: node_utils_1.unescapeStringLiteralText(text),
                        raw: text,
                        range: [start, end],
                    });
                }
                else {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.Literal,
                        value: node_utils_1.unescapeStringLiteralText(text),
                        raw: text,
                        range: [start, end],
                    });
                }
            }
            case SyntaxKind.JsxSpreadAttribute:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.JSXSpreadAttribute,
                    argument: this.convertChild(node.expression),
                });
            case SyntaxKind.QualifiedName: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSQualifiedName,
                    left: this.convertChild(node.left),
                    right: this.convertChild(node.right),
                });
            }
            // TypeScript specific
            case SyntaxKind.TypeReference: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSTypeReference,
                    typeName: this.convertType(node.typeName),
                    typeParameters: node.typeArguments
                        ? this.convertTypeArgumentsToTypeParameters(node.typeArguments, node)
                        : undefined,
                });
            }
            case SyntaxKind.TypeParameter: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSTypeParameter,
                    name: this.convertType(node.name),
                    constraint: node.constraint
                        ? this.convertType(node.constraint)
                        : undefined,
                    default: node.default ? this.convertType(node.default) : undefined,
                });
            }
            case SyntaxKind.ThisType:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSThisType,
                });
            case SyntaxKind.AnyKeyword:
            case SyntaxKind.BigIntKeyword:
            case SyntaxKind.BooleanKeyword:
            case SyntaxKind.NeverKeyword:
            case SyntaxKind.NumberKeyword:
            case SyntaxKind.ObjectKeyword:
            case SyntaxKind.StringKeyword:
            case SyntaxKind.SymbolKeyword:
            case SyntaxKind.UnknownKeyword:
            case SyntaxKind.VoidKeyword:
            case SyntaxKind.UndefinedKeyword:
            case SyntaxKind.IntrinsicKeyword: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES[`TS${SyntaxKind[node.kind]}`],
                });
            }
            case SyntaxKind.NonNullExpression: {
                const nnExpr = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSNonNullExpression,
                    expression: this.convertChild(node.expression),
                });
                return this.convertChainExpression(nnExpr, node);
            }
            case SyntaxKind.TypeLiteral: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSTypeLiteral,
                    members: node.members.map(el => this.convertChild(el)),
                });
            }
            case SyntaxKind.ArrayType: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSArrayType,
                    elementType: this.convertType(node.elementType),
                });
            }
            case SyntaxKind.IndexedAccessType: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSIndexedAccessType,
                    objectType: this.convertType(node.objectType),
                    indexType: this.convertType(node.indexType),
                });
            }
            case SyntaxKind.ConditionalType: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSConditionalType,
                    checkType: this.convertType(node.checkType),
                    extendsType: this.convertType(node.extendsType),
                    trueType: this.convertType(node.trueType),
                    falseType: this.convertType(node.falseType),
                });
            }
            case SyntaxKind.TypeQuery: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSTypeQuery,
                    exprName: this.convertType(node.exprName),
                });
            }
            case SyntaxKind.MappedType: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSMappedType,
                    typeParameter: this.convertType(node.typeParameter),
                    nameType: (_j = this.convertType(node.nameType)) !== null && _j !== void 0 ? _j : null,
                });
                if (node.readonlyToken) {
                    if (node.readonlyToken.kind === SyntaxKind.ReadonlyKeyword) {
                        result.readonly = true;
                    }
                    else {
                        result.readonly = node_utils_1.getTextForTokenKind(node.readonlyToken.kind);
                    }
                }
                if (node.questionToken) {
                    if (node.questionToken.kind === SyntaxKind.QuestionToken) {
                        result.optional = true;
                    }
                    else {
                        result.optional = node_utils_1.getTextForTokenKind(node.questionToken.kind);
                    }
                }
                if (node.type) {
                    result.typeAnnotation = this.convertType(node.type);
                }
                return result;
            }
            case SyntaxKind.ParenthesizedExpression:
                return this.convertChild(node.expression, parent);
            case SyntaxKind.TypeAliasDeclaration: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSTypeAliasDeclaration,
                    id: this.convertChild(node.name),
                    typeAnnotation: this.convertType(node.type),
                });
                if (node_utils_1.hasModifier(SyntaxKind.DeclareKeyword, node)) {
                    result.declare = true;
                }
                // Process typeParameters
                if (node.typeParameters) {
                    result.typeParameters =
                        this.convertTSTypeParametersToTypeParametersDeclaration(node.typeParameters);
                }
                // check for exports
                return this.fixExports(node, result);
            }
            case SyntaxKind.MethodSignature: {
                return this.convertMethodSignature(node);
            }
            case SyntaxKind.PropertySignature: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSPropertySignature,
                    optional: node_utils_1.isOptional(node) || undefined,
                    computed: node_utils_1.isComputedProperty(node.name),
                    key: this.convertChild(node.name),
                    typeAnnotation: node.type
                        ? this.convertTypeAnnotation(node.type, node)
                        : undefined,
                    initializer: this.convertChild(node.initializer) || undefined,
                    readonly: node_utils_1.hasModifier(SyntaxKind.ReadonlyKeyword, node) || undefined,
                    static: node_utils_1.hasModifier(SyntaxKind.StaticKeyword, node) || undefined,
                    export: node_utils_1.hasModifier(SyntaxKind.ExportKeyword, node) || undefined,
                });
                const accessibility = node_utils_1.getTSNodeAccessibility(node);
                if (accessibility) {
                    result.accessibility = accessibility;
                }
                return result;
            }
            case SyntaxKind.IndexSignature: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSIndexSignature,
                    parameters: node.parameters.map(el => this.convertChild(el)),
                });
                if (node.type) {
                    result.typeAnnotation = this.convertTypeAnnotation(node.type, node);
                }
                if (node_utils_1.hasModifier(SyntaxKind.ReadonlyKeyword, node)) {
                    result.readonly = true;
                }
                const accessibility = node_utils_1.getTSNodeAccessibility(node);
                if (accessibility) {
                    result.accessibility = accessibility;
                }
                if (node_utils_1.hasModifier(SyntaxKind.ExportKeyword, node)) {
                    result.export = true;
                }
                if (node_utils_1.hasModifier(SyntaxKind.StaticKeyword, node)) {
                    result.static = true;
                }
                return result;
            }
            case SyntaxKind.ConstructorType: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSConstructorType,
                    params: this.convertParameters(node.parameters),
                    abstract: node_utils_1.hasModifier(SyntaxKind.AbstractKeyword, node),
                });
                if (node.type) {
                    result.returnType = this.convertTypeAnnotation(node.type, node);
                }
                if (node.typeParameters) {
                    result.typeParameters =
                        this.convertTSTypeParametersToTypeParametersDeclaration(node.typeParameters);
                }
                return result;
            }
            case SyntaxKind.FunctionType:
            case SyntaxKind.ConstructSignature:
            case SyntaxKind.CallSignature: {
                const type = node.kind === SyntaxKind.ConstructSignature
                    ? ts_estree_1.AST_NODE_TYPES.TSConstructSignatureDeclaration
                    : node.kind === SyntaxKind.CallSignature
                        ? ts_estree_1.AST_NODE_TYPES.TSCallSignatureDeclaration
                        : ts_estree_1.AST_NODE_TYPES.TSFunctionType;
                const result = this.createNode(node, {
                    type: type,
                    params: this.convertParameters(node.parameters),
                });
                if (node.type) {
                    result.returnType = this.convertTypeAnnotation(node.type, node);
                }
                if (node.typeParameters) {
                    result.typeParameters =
                        this.convertTSTypeParametersToTypeParametersDeclaration(node.typeParameters);
                }
                return result;
            }
            case SyntaxKind.ExpressionWithTypeArguments: {
                const result = this.createNode(node, {
                    type: parent && parent.kind === SyntaxKind.InterfaceDeclaration
                        ? ts_estree_1.AST_NODE_TYPES.TSInterfaceHeritage
                        : ts_estree_1.AST_NODE_TYPES.TSClassImplements,
                    expression: this.convertChild(node.expression),
                });
                if (node.typeArguments) {
                    result.typeParameters = this.convertTypeArgumentsToTypeParameters(node.typeArguments, node);
                }
                return result;
            }
            case SyntaxKind.InterfaceDeclaration: {
                const interfaceHeritageClauses = (_k = node.heritageClauses) !== null && _k !== void 0 ? _k : [];
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSInterfaceDeclaration,
                    body: this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.TSInterfaceBody,
                        body: node.members.map(member => this.convertChild(member)),
                        range: [node.members.pos - 1, node.end],
                    }),
                    id: this.convertChild(node.name),
                });
                if (node.typeParameters) {
                    result.typeParameters =
                        this.convertTSTypeParametersToTypeParametersDeclaration(node.typeParameters);
                }
                if (interfaceHeritageClauses.length > 0) {
                    const interfaceExtends = [];
                    const interfaceImplements = [];
                    for (const heritageClause of interfaceHeritageClauses) {
                        if (heritageClause.token === SyntaxKind.ExtendsKeyword) {
                            for (const n of heritageClause.types) {
                                interfaceExtends.push(this.convertChild(n, node));
                            }
                        }
                        else {
                            for (const n of heritageClause.types) {
                                interfaceImplements.push(this.convertChild(n, node));
                            }
                        }
                    }
                    if (interfaceExtends.length) {
                        result.extends = interfaceExtends;
                    }
                    if (interfaceImplements.length) {
                        result.implements = interfaceImplements;
                    }
                }
                if (node_utils_1.hasModifier(SyntaxKind.AbstractKeyword, node)) {
                    result.abstract = true;
                }
                if (node_utils_1.hasModifier(SyntaxKind.DeclareKeyword, node)) {
                    result.declare = true;
                }
                // check for exports
                return this.fixExports(node, result);
            }
            case SyntaxKind.TypePredicate: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSTypePredicate,
                    asserts: node.assertsModifier !== undefined,
                    parameterName: this.convertChild(node.parameterName),
                    typeAnnotation: null,
                });
                /**
                 * Specific fix for type-guard location data
                 */
                if (node.type) {
                    result.typeAnnotation = this.convertTypeAnnotation(node.type, node);
                    result.typeAnnotation.loc = result.typeAnnotation.typeAnnotation.loc;
                    result.typeAnnotation.range =
                        result.typeAnnotation.typeAnnotation.range;
                }
                return result;
            }
            case SyntaxKind.ImportType:
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSImportType,
                    isTypeOf: !!node.isTypeOf,
                    parameter: this.convertChild(node.argument),
                    qualifier: this.convertChild(node.qualifier),
                    typeParameters: node.typeArguments
                        ? this.convertTypeArgumentsToTypeParameters(node.typeArguments, node)
                        : null,
                });
            case SyntaxKind.EnumDeclaration: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSEnumDeclaration,
                    id: this.convertChild(node.name),
                    members: node.members.map(el => this.convertChild(el)),
                });
                // apply modifiers first...
                this.applyModifiersToResult(result, node.modifiers);
                // ...then check for exports
                return this.fixExports(node, result);
            }
            case SyntaxKind.EnumMember: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSEnumMember,
                    id: this.convertChild(node.name),
                });
                if (node.initializer) {
                    result.initializer = this.convertChild(node.initializer);
                }
                if (node.name.kind === ts.SyntaxKind.ComputedPropertyName) {
                    result.computed = true;
                }
                return result;
            }
            case SyntaxKind.ModuleDeclaration: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSModuleDeclaration,
                    id: this.convertChild(node.name),
                });
                if (node.body) {
                    result.body = this.convertChild(node.body);
                }
                // apply modifiers first...
                this.applyModifiersToResult(result, node.modifiers);
                if (node.flags & ts.NodeFlags.GlobalAugmentation) {
                    result.global = true;
                }
                // ...then check for exports
                return this.fixExports(node, result);
            }
            // TypeScript specific types
            case SyntaxKind.ParenthesizedType: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSParenthesizedType,
                    typeAnnotation: this.convertType(node.type),
                });
            }
            case SyntaxKind.UnionType: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSUnionType,
                    types: node.types.map(el => this.convertType(el)),
                });
            }
            case SyntaxKind.IntersectionType: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSIntersectionType,
                    types: node.types.map(el => this.convertType(el)),
                });
            }
            case SyntaxKind.AsExpression: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSAsExpression,
                    expression: this.convertChild(node.expression),
                    typeAnnotation: this.convertType(node.type),
                });
            }
            case SyntaxKind.InferType: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSInferType,
                    typeParameter: this.convertType(node.typeParameter),
                });
            }
            case SyntaxKind.LiteralType: {
                if (version_check_1.typescriptVersionIsAtLeast['4.0'] &&
                    node.literal.kind === SyntaxKind.NullKeyword) {
                    // 4.0 started nesting null types inside a LiteralType node
                    // but our AST is designed around the old way of null being a keyword
                    return this.createNode(node.literal, {
                        type: ts_estree_1.AST_NODE_TYPES.TSNullKeyword,
                    });
                }
                else {
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.TSLiteralType,
                        literal: this.convertType(node.literal),
                    });
                }
            }
            case SyntaxKind.TypeAssertionExpression: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSTypeAssertion,
                    typeAnnotation: this.convertType(node.type),
                    expression: this.convertChild(node.expression),
                });
            }
            case SyntaxKind.ImportEqualsDeclaration: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSImportEqualsDeclaration,
                    id: this.convertChild(node.name),
                    moduleReference: this.convertChild(node.moduleReference),
                    importKind: node.isTypeOnly ? 'type' : 'value',
                    isExport: node_utils_1.hasModifier(SyntaxKind.ExportKeyword, node),
                });
            }
            case SyntaxKind.ExternalModuleReference: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSExternalModuleReference,
                    expression: this.convertChild(node.expression),
                });
            }
            case SyntaxKind.NamespaceExportDeclaration: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSNamespaceExportDeclaration,
                    id: this.convertChild(node.name),
                });
            }
            case SyntaxKind.AbstractKeyword: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSAbstractKeyword,
                });
            }
            // Tuple
            case SyntaxKind.TupleType: {
                // In TS 4.0, the `elementTypes` property was changed to `elements`.
                // To support both at compile time, we cast to access the newer version
                // if the former does not exist.
                const elementTypes = 'elementTypes' in node
                    ? node.elementTypes.map((el) => this.convertType(el))
                    : node.elements.map(el => this.convertType(el));
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSTupleType,
                    elementTypes,
                });
            }
            case SyntaxKind.NamedTupleMember: {
                const member = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSNamedTupleMember,
                    elementType: this.convertType(node.type, node),
                    label: this.convertChild(node.name, node),
                    optional: node.questionToken != null,
                });
                if (node.dotDotDotToken) {
                    // adjust the start to account for the "..."
                    member.range[0] = member.label.range[0];
                    member.loc.start = member.label.loc.start;
                    return this.createNode(node, {
                        type: ts_estree_1.AST_NODE_TYPES.TSRestType,
                        typeAnnotation: member,
                    });
                }
                return member;
            }
            case SyntaxKind.OptionalType: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSOptionalType,
                    typeAnnotation: this.convertType(node.type),
                });
            }
            case SyntaxKind.RestType: {
                return this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSRestType,
                    typeAnnotation: this.convertType(node.type),
                });
            }
            // Template Literal Types
            case SyntaxKind.TemplateLiteralType: {
                const result = this.createNode(node, {
                    type: ts_estree_1.AST_NODE_TYPES.TSTemplateLiteralType,
                    quasis: [this.convertChild(node.head)],
                    types: [],
                });
                node.templateSpans.forEach(templateSpan => {
                    result.types.push(this.convertChild(templateSpan.type));
                    result.quasis.push(this.convertChild(templateSpan.literal));
                });
                return result;
            }
            default:
                return this.deeplyCopy(node);
        }
    }
}
exports.Converter = Converter;
//# sourceMappingURL=convert.js.map