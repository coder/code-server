"use strict";
/**
 * @fileoverview Really small utility functions that didn't deserve their own files
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.upperCaseFirst = exports.isDefinitionFile = exports.getNameFromMember = exports.getNameFromIndexSignature = exports.getEnumNames = exports.findFirstResult = exports.arraysAreEqual = void 0;
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
/**
 * Check if the context file name is *.d.ts or *.d.tsx
 */
function isDefinitionFile(fileName) {
    return /\.d\.tsx?$/i.test(fileName || '');
}
exports.isDefinitionFile = isDefinitionFile;
/**
 * Upper cases the first character or the string
 */
function upperCaseFirst(str) {
    return str[0].toUpperCase() + str.slice(1);
}
exports.upperCaseFirst = upperCaseFirst;
function arraysAreEqual(a, b, eq) {
    return (a === b ||
        (a !== undefined &&
            b !== undefined &&
            a.length === b.length &&
            a.every((x, idx) => eq(x, b[idx]))));
}
exports.arraysAreEqual = arraysAreEqual;
/** Returns the first non-`undefined` result. */
function findFirstResult(inputs, getResult) {
    for (const element of inputs) {
        const result = getResult(element);
        if (result !== undefined) {
            return result;
        }
    }
    return undefined;
}
exports.findFirstResult = findFirstResult;
/**
 * Gets a string representation of the name of the index signature.
 */
function getNameFromIndexSignature(node) {
    const propName = node.parameters.find((parameter) => parameter.type === experimental_utils_1.AST_NODE_TYPES.Identifier);
    return propName ? propName.name : '(index signature)';
}
exports.getNameFromIndexSignature = getNameFromIndexSignature;
/**
 * Gets a string name representation of the name of the given MethodDefinition
 * or ClassProperty node, with handling for computed property names.
 */
function getNameFromMember(member, sourceCode) {
    if (member.key.type === experimental_utils_1.AST_NODE_TYPES.Identifier) {
        return member.key.name;
    }
    if (member.key.type === experimental_utils_1.AST_NODE_TYPES.Literal) {
        return `${member.key.value}`;
    }
    return sourceCode.text.slice(...member.key.range);
}
exports.getNameFromMember = getNameFromMember;
function getEnumNames(myEnum) {
    return Object.keys(myEnum).filter(x => isNaN(parseInt(x)));
}
exports.getEnumNames = getEnumNames;
//# sourceMappingURL=misc.js.map