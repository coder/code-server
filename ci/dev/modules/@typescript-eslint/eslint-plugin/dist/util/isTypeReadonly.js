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
exports.isTypeReadonly = void 0;
const tsutils_1 = require("tsutils");
const ts = __importStar(require("typescript"));
const _1 = require(".");
function isTypeReadonlyArrayOrTuple(checker, type, seenTypes) {
    function checkTypeArguments(arrayType) {
        const typeArguments = checker.getTypeArguments(arrayType);
        // this shouldn't happen in reality as:
        // - tuples require at least 1 type argument
        // - ReadonlyArray requires at least 1 type argument
        /* istanbul ignore if */ if (typeArguments.length === 0) {
            return 3 /* Readonly */;
        }
        // validate the element types are also readonly
        if (typeArguments.some(typeArg => isTypeReadonlyRecurser(checker, typeArg, seenTypes) ===
            2 /* Mutable */)) {
            return 2 /* Mutable */;
        }
        return 3 /* Readonly */;
    }
    if (checker.isArrayType(type)) {
        const symbol = _1.nullThrows(type.getSymbol(), _1.NullThrowsReasons.MissingToken('symbol', 'array type'));
        const escapedName = symbol.getEscapedName();
        if (escapedName === 'Array') {
            return 2 /* Mutable */;
        }
        return checkTypeArguments(type);
    }
    if (checker.isTupleType(type)) {
        if (!type.target.readonly) {
            return 2 /* Mutable */;
        }
        return checkTypeArguments(type);
    }
    return 1 /* UnknownType */;
}
function isTypeReadonlyObject(checker, type, seenTypes) {
    function checkIndexSignature(kind) {
        const indexInfo = checker.getIndexInfoOfType(type, kind);
        if (indexInfo) {
            return indexInfo.isReadonly
                ? 3 /* Readonly */
                : 2 /* Mutable */;
        }
        return 1 /* UnknownType */;
    }
    const properties = type.getProperties();
    if (properties.length) {
        // ensure the properties are marked as readonly
        for (const property of properties) {
            if (!tsutils_1.isPropertyReadonlyInType(type, property.getEscapedName(), checker)) {
                return 2 /* Mutable */;
            }
        }
        // all properties were readonly
        // now ensure that all of the values are readonly also.
        // do this after checking property readonly-ness as a perf optimization,
        // as we might be able to bail out early due to a mutable property before
        // doing this deep, potentially expensive check.
        for (const property of properties) {
            const propertyType = _1.nullThrows(_1.getTypeOfPropertyOfType(checker, type, property), _1.NullThrowsReasons.MissingToken(`property "${property.name}"`, 'type'));
            // handle recursive types.
            // we only need this simple check, because a mutable recursive type will break via the above prop readonly check
            if (seenTypes.has(propertyType)) {
                continue;
            }
            if (isTypeReadonlyRecurser(checker, propertyType, seenTypes) ===
                2 /* Mutable */) {
                return 2 /* Mutable */;
            }
        }
    }
    const isStringIndexSigReadonly = checkIndexSignature(ts.IndexKind.String);
    if (isStringIndexSigReadonly === 2 /* Mutable */) {
        return isStringIndexSigReadonly;
    }
    const isNumberIndexSigReadonly = checkIndexSignature(ts.IndexKind.Number);
    if (isNumberIndexSigReadonly === 2 /* Mutable */) {
        return isNumberIndexSigReadonly;
    }
    return 3 /* Readonly */;
}
// a helper function to ensure the seenTypes map is always passed down, except by the external caller
function isTypeReadonlyRecurser(checker, type, seenTypes) {
    seenTypes.add(type);
    if (tsutils_1.isUnionType(type)) {
        // all types in the union must be readonly
        const result = tsutils_1.unionTypeParts(type).every(t => isTypeReadonlyRecurser(checker, t, seenTypes));
        const readonlyness = result ? 3 /* Readonly */ : 2 /* Mutable */;
        return readonlyness;
    }
    // all non-object, non-intersection types are readonly.
    // this should only be primitive types
    if (!tsutils_1.isObjectType(type) && !tsutils_1.isUnionOrIntersectionType(type)) {
        return 3 /* Readonly */;
    }
    // pure function types are readonly
    if (type.getCallSignatures().length > 0 &&
        type.getProperties().length === 0) {
        return 3 /* Readonly */;
    }
    const isReadonlyArray = isTypeReadonlyArrayOrTuple(checker, type, seenTypes);
    if (isReadonlyArray !== 1 /* UnknownType */) {
        return isReadonlyArray;
    }
    const isReadonlyObject = isTypeReadonlyObject(checker, type, seenTypes);
    /* istanbul ignore else */ if (isReadonlyObject !== 1 /* UnknownType */) {
        return isReadonlyObject;
    }
    throw new Error('Unhandled type');
}
/**
 * Checks if the given type is readonly
 */
function isTypeReadonly(checker, type) {
    return (isTypeReadonlyRecurser(checker, type, new Set()) === 3 /* Readonly */);
}
exports.isTypeReadonly = isTypeReadonly;
//# sourceMappingURL=isTypeReadonly.js.map