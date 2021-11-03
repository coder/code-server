"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeOfPropertyOfType = exports.getTypeOfPropertyOfName = void 0;
function getTypeOfPropertyOfName(checker, type, name, escapedName) {
    // Most names are directly usable in the checker and aren't different from escaped names
    if (!escapedName || !name.startsWith('__')) {
        return checker.getTypeOfPropertyOfType(type, name);
    }
    // Symbolic names may differ in their escaped name compared to their human-readable name
    // https://github.com/typescript-eslint/typescript-eslint/issues/2143
    const escapedProperty = type
        .getProperties()
        .find(property => property.escapedName === escapedName);
    return escapedProperty
        ? checker.getDeclaredTypeOfSymbol(escapedProperty)
        : undefined;
}
exports.getTypeOfPropertyOfName = getTypeOfPropertyOfName;
function getTypeOfPropertyOfType(checker, type, property) {
    return getTypeOfPropertyOfName(checker, type, property.getName(), property.getEscapedName());
}
exports.getTypeOfPropertyOfType = getTypeOfPropertyOfType;
//# sourceMappingURL=propertyTypes.js.map