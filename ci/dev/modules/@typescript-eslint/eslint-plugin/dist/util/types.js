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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContextualType = exports.isUnsafeAssignment = exports.isAnyOrAnyArrayTypeDiscriminated = exports.isTypeUnknownArrayType = exports.isTypeAnyArrayType = exports.isTypeAnyType = exports.isTypeUnknownType = exports.getTypeArguments = exports.getEqualsKind = exports.getTokenAtPosition = exports.getSourceFileOfNode = exports.typeIsOrHasBaseType = exports.isTypeFlagSet = exports.getTypeFlags = exports.getDeclaration = exports.isNullableType = exports.getConstrainedTypeAtLocation = exports.getTypeName = exports.containsAllTypesByName = exports.isTypeArrayTypeOrUnionOfArrayTypes = void 0;
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const debug_1 = __importDefault(require("debug"));
const tsutils_1 = require("tsutils");
const ts = __importStar(require("typescript"));
const log = debug_1.default('typescript-eslint:eslint-plugin:utils:types');
/**
 * Checks if the given type is either an array type,
 * or a union made up solely of array types.
 */
function isTypeArrayTypeOrUnionOfArrayTypes(type, checker) {
    for (const t of tsutils_1.unionTypeParts(type)) {
        if (!checker.isArrayType(t)) {
            return false;
        }
    }
    return true;
}
exports.isTypeArrayTypeOrUnionOfArrayTypes = isTypeArrayTypeOrUnionOfArrayTypes;
/**
 * @param type Type being checked by name.
 * @param allowedNames Symbol names checking on the type.
 * @returns Whether the type is, extends, or contains all of the allowed names.
 */
function containsAllTypesByName(type, allowAny, allowedNames) {
    if (isTypeFlagSet(type, ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
        return !allowAny;
    }
    if (tsutils_1.isTypeReference(type)) {
        type = type.target;
    }
    const symbol = type.getSymbol();
    if (symbol && allowedNames.has(symbol.name)) {
        return true;
    }
    if (tsutils_1.isUnionOrIntersectionType(type)) {
        return type.types.every(t => containsAllTypesByName(t, allowAny, allowedNames));
    }
    const bases = type.getBaseTypes();
    return (typeof bases !== 'undefined' &&
        bases.length > 0 &&
        bases.every(t => containsAllTypesByName(t, allowAny, allowedNames)));
}
exports.containsAllTypesByName = containsAllTypesByName;
/**
 * Get the type name of a given type.
 * @param typeChecker The context sensitive TypeScript TypeChecker.
 * @param type The type to get the name of.
 */
function getTypeName(typeChecker, type) {
    // It handles `string` and string literal types as string.
    if ((type.flags & ts.TypeFlags.StringLike) !== 0) {
        return 'string';
    }
    // If the type is a type parameter which extends primitive string types,
    // but it was not recognized as a string like. So check the constraint
    // type of the type parameter.
    if ((type.flags & ts.TypeFlags.TypeParameter) !== 0) {
        // `type.getConstraint()` method doesn't return the constraint type of
        // the type parameter for some reason. So this gets the constraint type
        // via AST.
        const symbol = type.getSymbol();
        const decls = symbol === null || symbol === void 0 ? void 0 : symbol.getDeclarations();
        const typeParamDecl = decls === null || decls === void 0 ? void 0 : decls[0];
        if (ts.isTypeParameterDeclaration(typeParamDecl) &&
            typeParamDecl.constraint != null) {
            return getTypeName(typeChecker, typeChecker.getTypeFromTypeNode(typeParamDecl.constraint));
        }
    }
    // If the type is a union and all types in the union are string like,
    // return `string`. For example:
    // - `"a" | "b"` is string.
    // - `string | string[]` is not string.
    if (type.isUnion() &&
        type.types
            .map(value => getTypeName(typeChecker, value))
            .every(t => t === 'string')) {
        return 'string';
    }
    // If the type is an intersection and a type in the intersection is string
    // like, return `string`. For example: `string & {__htmlEscaped: void}`
    if (type.isIntersection() &&
        type.types
            .map(value => getTypeName(typeChecker, value))
            .some(t => t === 'string')) {
        return 'string';
    }
    return typeChecker.typeToString(type);
}
exports.getTypeName = getTypeName;
/**
 * Resolves the given node's type. Will resolve to the type's generic constraint, if it has one.
 */
function getConstrainedTypeAtLocation(checker, node) {
    const nodeType = checker.getTypeAtLocation(node);
    const constrained = checker.getBaseConstraintOfType(nodeType);
    return constrained !== null && constrained !== void 0 ? constrained : nodeType;
}
exports.getConstrainedTypeAtLocation = getConstrainedTypeAtLocation;
/**
 * Checks if the given type is (or accepts) nullable
 * @param isReceiver true if the type is a receiving type (i.e. the type of a called function's parameter)
 */
function isNullableType(type, { isReceiver = false, allowUndefined = true, } = {}) {
    const flags = getTypeFlags(type);
    if (isReceiver && flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
        return true;
    }
    if (allowUndefined) {
        return (flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)) !== 0;
    }
    else {
        return (flags & ts.TypeFlags.Null) !== 0;
    }
}
exports.isNullableType = isNullableType;
/**
 * Gets the declaration for the given variable
 */
function getDeclaration(checker, node) {
    var _a;
    const symbol = checker.getSymbolAtLocation(node);
    if (!symbol) {
        return null;
    }
    const declarations = symbol.getDeclarations();
    return (_a = declarations === null || declarations === void 0 ? void 0 : declarations[0]) !== null && _a !== void 0 ? _a : null;
}
exports.getDeclaration = getDeclaration;
/**
 * Gets all of the type flags in a type, iterating through unions automatically
 */
function getTypeFlags(type) {
    let flags = 0;
    for (const t of tsutils_1.unionTypeParts(type)) {
        flags |= t.flags;
    }
    return flags;
}
exports.getTypeFlags = getTypeFlags;
/**
 * Checks if the given type is (or accepts) the given flags
 * @param isReceiver true if the type is a receiving type (i.e. the type of a called function's parameter)
 */
function isTypeFlagSet(type, flagsToCheck, isReceiver) {
    const flags = getTypeFlags(type);
    if (isReceiver && flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
        return true;
    }
    return (flags & flagsToCheck) !== 0;
}
exports.isTypeFlagSet = isTypeFlagSet;
/**
 * @returns Whether a type is an instance of the parent type, including for the parent's base types.
 */
function typeIsOrHasBaseType(type, parentType) {
    const parentSymbol = parentType.getSymbol();
    if (!type.getSymbol() || !parentSymbol) {
        return false;
    }
    const typeAndBaseTypes = [type];
    const ancestorTypes = type.getBaseTypes();
    if (ancestorTypes) {
        typeAndBaseTypes.push(...ancestorTypes);
    }
    for (const baseType of typeAndBaseTypes) {
        const baseSymbol = baseType.getSymbol();
        if (baseSymbol && baseSymbol.name === parentSymbol.name) {
            return true;
        }
    }
    return false;
}
exports.typeIsOrHasBaseType = typeIsOrHasBaseType;
/**
 * Gets the source file for a given node
 */
function getSourceFileOfNode(node) {
    while (node && node.kind !== ts.SyntaxKind.SourceFile) {
        node = node.parent;
    }
    return node;
}
exports.getSourceFileOfNode = getSourceFileOfNode;
function getTokenAtPosition(sourceFile, position) {
    const queue = [sourceFile];
    let current;
    while (queue.length > 0) {
        current = queue.shift();
        // find the child that contains 'position'
        for (const child of current.getChildren(sourceFile)) {
            const start = child.getFullStart();
            if (start > position) {
                // If this child begins after position, then all subsequent children will as well.
                return current;
            }
            const end = child.getEnd();
            if (position < end ||
                (position === end && child.kind === ts.SyntaxKind.EndOfFileToken)) {
                queue.push(child);
                break;
            }
        }
    }
    return current;
}
exports.getTokenAtPosition = getTokenAtPosition;
function getEqualsKind(operator) {
    switch (operator) {
        case '==':
            return {
                isPositive: true,
                isStrict: false,
            };
        case '===':
            return {
                isPositive: true,
                isStrict: true,
            };
        case '!=':
            return {
                isPositive: false,
                isStrict: false,
            };
        case '!==':
            return {
                isPositive: false,
                isStrict: true,
            };
        default:
            return undefined;
    }
}
exports.getEqualsKind = getEqualsKind;
function getTypeArguments(type, checker) {
    var _a;
    // getTypeArguments was only added in TS3.7
    if (checker.getTypeArguments) {
        return checker.getTypeArguments(type);
    }
    return (_a = type.typeArguments) !== null && _a !== void 0 ? _a : [];
}
exports.getTypeArguments = getTypeArguments;
/**
 * @returns true if the type is `unknown`
 */
function isTypeUnknownType(type) {
    return isTypeFlagSet(type, ts.TypeFlags.Unknown);
}
exports.isTypeUnknownType = isTypeUnknownType;
/**
 * @returns true if the type is `any`
 */
function isTypeAnyType(type) {
    if (isTypeFlagSet(type, ts.TypeFlags.Any)) {
        if (type.intrinsicName === 'error') {
            log('Found an "error" any type');
        }
        return true;
    }
    return false;
}
exports.isTypeAnyType = isTypeAnyType;
/**
 * @returns true if the type is `any[]`
 */
function isTypeAnyArrayType(type, checker) {
    return (checker.isArrayType(type) &&
        isTypeAnyType(
        // getTypeArguments was only added in TS3.7
        getTypeArguments(type, checker)[0]));
}
exports.isTypeAnyArrayType = isTypeAnyArrayType;
/**
 * @returns true if the type is `unknown[]`
 */
function isTypeUnknownArrayType(type, checker) {
    return (checker.isArrayType(type) &&
        isTypeUnknownType(
        // getTypeArguments was only added in TS3.7
        getTypeArguments(type, checker)[0]));
}
exports.isTypeUnknownArrayType = isTypeUnknownArrayType;
/**
 * @returns `AnyType.Any` if the type is `any`, `AnyType.AnyArray` if the type is `any[]` or `readonly any[]`,
 *          otherwise it returns `AnyType.Safe`.
 */
function isAnyOrAnyArrayTypeDiscriminated(node, checker) {
    const type = checker.getTypeAtLocation(node);
    if (isTypeAnyType(type)) {
        return 0 /* Any */;
    }
    if (isTypeAnyArrayType(type, checker)) {
        return 1 /* AnyArray */;
    }
    return 2 /* Safe */;
}
exports.isAnyOrAnyArrayTypeDiscriminated = isAnyOrAnyArrayTypeDiscriminated;
/**
 * Does a simple check to see if there is an any being assigned to a non-any type.
 *
 * This also checks generic positions to ensure there's no unsafe sub-assignments.
 * Note: in the case of generic positions, it makes the assumption that the two types are the same.
 *
 * @example See tests for examples
 *
 * @returns false if it's safe, or an object with the two types if it's unsafe
 */
function isUnsafeAssignment(type, receiver, checker, senderNode) {
    var _a, _b;
    if (isTypeAnyType(type)) {
        // Allow assignment of any ==> unknown.
        if (isTypeUnknownType(receiver)) {
            return false;
        }
        if (!isTypeAnyType(receiver)) {
            return { sender: type, receiver };
        }
    }
    if (tsutils_1.isTypeReference(type) && tsutils_1.isTypeReference(receiver)) {
        // TODO - figure out how to handle cases like this,
        // where the types are assignable, but not the same type
        /*
        function foo(): ReadonlySet<number> { return new Set<any>(); }
    
        // and
    
        type Test<T> = { prop: T }
        type Test2 = { prop: string }
        declare const a: Test<any>;
        const b: Test2 = a;
        */
        if (type.target !== receiver.target) {
            // if the type references are different, assume safe, as we won't know how to compare the two types
            // the generic positions might not be equivalent for both types
            return false;
        }
        if ((senderNode === null || senderNode === void 0 ? void 0 : senderNode.type) === experimental_utils_1.AST_NODE_TYPES.NewExpression &&
            senderNode.callee.type === experimental_utils_1.AST_NODE_TYPES.Identifier &&
            senderNode.callee.name === 'Map' &&
            senderNode.arguments.length === 0 &&
            senderNode.typeParameters == null) {
            // special case to handle `new Map()`
            // unfortunately Map's default empty constructor is typed to return `Map<any, any>` :(
            // https://github.com/typescript-eslint/typescript-eslint/issues/2109#issuecomment-634144396
            return false;
        }
        const typeArguments = (_a = type.typeArguments) !== null && _a !== void 0 ? _a : [];
        const receiverTypeArguments = (_b = receiver.typeArguments) !== null && _b !== void 0 ? _b : [];
        for (let i = 0; i < typeArguments.length; i += 1) {
            const arg = typeArguments[i];
            const receiverArg = receiverTypeArguments[i];
            const unsafe = isUnsafeAssignment(arg, receiverArg, checker, senderNode);
            if (unsafe) {
                return { sender: type, receiver };
            }
        }
        return false;
    }
    return false;
}
exports.isUnsafeAssignment = isUnsafeAssignment;
/**
 * Returns the contextual type of a given node.
 * Contextual type is the type of the target the node is going into.
 * i.e. the type of a called function's parameter, or the defined type of a variable declaration
 */
function getContextualType(checker, node) {
    const parent = node.parent;
    if (!parent) {
        return;
    }
    if (tsutils_1.isCallExpression(parent) || tsutils_1.isNewExpression(parent)) {
        if (node === parent.expression) {
            // is the callee, so has no contextual type
            return;
        }
    }
    else if (tsutils_1.isVariableDeclaration(parent) ||
        tsutils_1.isPropertyDeclaration(parent) ||
        tsutils_1.isParameterDeclaration(parent)) {
        return parent.type ? checker.getTypeFromTypeNode(parent.type) : undefined;
    }
    else if (tsutils_1.isJsxExpression(parent)) {
        return checker.getContextualType(parent);
    }
    else if (tsutils_1.isPropertyAssignment(parent) && tsutils_1.isIdentifier(node)) {
        return checker.getContextualType(node);
    }
    else if (tsutils_1.isBinaryExpression(parent) &&
        parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        parent.right === node) {
        // is RHS of assignment
        return checker.getTypeAtLocation(parent.left);
    }
    else if (![ts.SyntaxKind.TemplateSpan, ts.SyntaxKind.JsxExpression].includes(parent.kind)) {
        // parent is not something we know we can get the contextual type of
        return;
    }
    // TODO - support return statement checking
    return checker.getContextualType(node);
}
exports.getContextualType = getContextualType;
//# sourceMappingURL=types.js.map