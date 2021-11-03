"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParserServices = exports.isObjectNotArray = exports.deepMerge = exports.applyDefault = void 0;
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
__exportStar(require("./astUtils"), exports);
__exportStar(require("./collectUnusedVariables"), exports);
__exportStar(require("./createRule"), exports);
__exportStar(require("./getFunctionHeadLoc"), exports);
__exportStar(require("./getThisExpression"), exports);
__exportStar(require("./getWrappingFixer"), exports);
__exportStar(require("./isTypeReadonly"), exports);
__exportStar(require("./misc"), exports);
__exportStar(require("./nullThrows"), exports);
__exportStar(require("./objectIterators"), exports);
__exportStar(require("./propertyTypes"), exports);
__exportStar(require("./requiresQuoting"), exports);
__exportStar(require("./types"), exports);
// this is done for convenience - saves migrating all of the old rules
const { applyDefault, deepMerge, isObjectNotArray, getParserServices } = experimental_utils_1.ESLintUtils;
exports.applyDefault = applyDefault;
exports.deepMerge = deepMerge;
exports.isObjectNotArray = isObjectNotArray;
exports.getParserServices = getParserServices;
//# sourceMappingURL=index.js.map