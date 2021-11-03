"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVariableDeclarator = exports.isTypeAssertion = exports.isTSFunctionType = exports.isTSConstructorType = exports.isSetter = exports.isOptionalCallExpression = exports.isOptionalChainPunctuator = exports.isNotOptionalChainPunctuator = exports.isNotNonNullAssertionPunctuator = exports.isNonNullAssertionPunctuator = exports.isLogicalOrOperator = exports.isLoop = exports.isIdentifier = exports.isFunctionType = exports.isFunctionOrFunctionType = exports.isFunction = exports.isClassOrTypeElement = exports.isConstructor = exports.isAwaitKeyword = exports.isAwaitExpression = void 0;
const ts_estree_1 = require("../ts-estree");
function isOptionalChainPunctuator(token) {
    return token.type === ts_estree_1.AST_TOKEN_TYPES.Punctuator && token.value === '?.';
}
exports.isOptionalChainPunctuator = isOptionalChainPunctuator;
function isNotOptionalChainPunctuator(token) {
    return !isOptionalChainPunctuator(token);
}
exports.isNotOptionalChainPunctuator = isNotOptionalChainPunctuator;
function isNonNullAssertionPunctuator(token) {
    return token.type === ts_estree_1.AST_TOKEN_TYPES.Punctuator && token.value === '!';
}
exports.isNonNullAssertionPunctuator = isNonNullAssertionPunctuator;
function isNotNonNullAssertionPunctuator(token) {
    return !isNonNullAssertionPunctuator(token);
}
exports.isNotNonNullAssertionPunctuator = isNotNonNullAssertionPunctuator;
/**
 * Returns true if and only if the node represents: foo?.() or foo.bar?.()
 */
function isOptionalCallExpression(node) {
    return (node.type === ts_estree_1.AST_NODE_TYPES.CallExpression &&
        // this flag means the call expression itself is option
        // i.e. it is foo.bar?.() and not foo?.bar()
        node.optional);
}
exports.isOptionalCallExpression = isOptionalCallExpression;
/**
 * Returns true if and only if the node represents logical OR
 */
function isLogicalOrOperator(node) {
    return (node.type === ts_estree_1.AST_NODE_TYPES.LogicalExpression && node.operator === '||');
}
exports.isLogicalOrOperator = isLogicalOrOperator;
/**
 * Checks if a node is a type assertion:
 * ```
 * x as foo
 * <foo>x
 * ```
 */
function isTypeAssertion(node) {
    if (!node) {
        return false;
    }
    return (node.type === ts_estree_1.AST_NODE_TYPES.TSAsExpression ||
        node.type === ts_estree_1.AST_NODE_TYPES.TSTypeAssertion);
}
exports.isTypeAssertion = isTypeAssertion;
function isVariableDeclarator(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === ts_estree_1.AST_NODE_TYPES.VariableDeclarator;
}
exports.isVariableDeclarator = isVariableDeclarator;
function isFunction(node) {
    if (!node) {
        return false;
    }
    return [
        ts_estree_1.AST_NODE_TYPES.ArrowFunctionExpression,
        ts_estree_1.AST_NODE_TYPES.FunctionDeclaration,
        ts_estree_1.AST_NODE_TYPES.FunctionExpression,
    ].includes(node.type);
}
exports.isFunction = isFunction;
function isFunctionType(node) {
    if (!node) {
        return false;
    }
    return [
        ts_estree_1.AST_NODE_TYPES.TSCallSignatureDeclaration,
        ts_estree_1.AST_NODE_TYPES.TSConstructorType,
        ts_estree_1.AST_NODE_TYPES.TSConstructSignatureDeclaration,
        ts_estree_1.AST_NODE_TYPES.TSEmptyBodyFunctionExpression,
        ts_estree_1.AST_NODE_TYPES.TSFunctionType,
        ts_estree_1.AST_NODE_TYPES.TSMethodSignature,
    ].includes(node.type);
}
exports.isFunctionType = isFunctionType;
function isFunctionOrFunctionType(node) {
    return isFunction(node) || isFunctionType(node);
}
exports.isFunctionOrFunctionType = isFunctionOrFunctionType;
function isTSFunctionType(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === ts_estree_1.AST_NODE_TYPES.TSFunctionType;
}
exports.isTSFunctionType = isTSFunctionType;
function isTSConstructorType(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === ts_estree_1.AST_NODE_TYPES.TSConstructorType;
}
exports.isTSConstructorType = isTSConstructorType;
function isClassOrTypeElement(node) {
    if (!node) {
        return false;
    }
    return [
        // ClassElement
        ts_estree_1.AST_NODE_TYPES.ClassProperty,
        ts_estree_1.AST_NODE_TYPES.FunctionExpression,
        ts_estree_1.AST_NODE_TYPES.MethodDefinition,
        ts_estree_1.AST_NODE_TYPES.TSAbstractClassProperty,
        ts_estree_1.AST_NODE_TYPES.TSAbstractMethodDefinition,
        ts_estree_1.AST_NODE_TYPES.TSEmptyBodyFunctionExpression,
        ts_estree_1.AST_NODE_TYPES.TSIndexSignature,
        // TypeElement
        ts_estree_1.AST_NODE_TYPES.TSCallSignatureDeclaration,
        ts_estree_1.AST_NODE_TYPES.TSConstructSignatureDeclaration,
        // AST_NODE_TYPES.TSIndexSignature,
        ts_estree_1.AST_NODE_TYPES.TSMethodSignature,
        ts_estree_1.AST_NODE_TYPES.TSPropertySignature,
    ].includes(node.type);
}
exports.isClassOrTypeElement = isClassOrTypeElement;
/**
 * Checks if a node is a constructor method.
 */
function isConstructor(node) {
    return ((node === null || node === void 0 ? void 0 : node.type) === ts_estree_1.AST_NODE_TYPES.MethodDefinition &&
        node.kind === 'constructor');
}
exports.isConstructor = isConstructor;
/**
 * Checks if a node is a setter method.
 */
function isSetter(node) {
    return (!!node &&
        (node.type === ts_estree_1.AST_NODE_TYPES.MethodDefinition ||
            node.type === ts_estree_1.AST_NODE_TYPES.Property) &&
        node.kind === 'set');
}
exports.isSetter = isSetter;
function isIdentifier(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === ts_estree_1.AST_NODE_TYPES.Identifier;
}
exports.isIdentifier = isIdentifier;
/**
 * Checks if a node represents an `await …` expression.
 */
function isAwaitExpression(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === ts_estree_1.AST_NODE_TYPES.AwaitExpression;
}
exports.isAwaitExpression = isAwaitExpression;
/**
 * Checks if a possible token is the `await` keyword.
 */
function isAwaitKeyword(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === ts_estree_1.AST_TOKEN_TYPES.Identifier && node.value === 'await';
}
exports.isAwaitKeyword = isAwaitKeyword;
function isLoop(node) {
    if (!node) {
        return false;
    }
    return (node.type === ts_estree_1.AST_NODE_TYPES.DoWhileStatement ||
        node.type === ts_estree_1.AST_NODE_TYPES.ForStatement ||
        node.type === ts_estree_1.AST_NODE_TYPES.ForInStatement ||
        node.type === ts_estree_1.AST_NODE_TYPES.ForOfStatement ||
        node.type === ts_estree_1.AST_NODE_TYPES.WhileStatement);
}
exports.isLoop = isLoop;
//# sourceMappingURL=predicates.js.map