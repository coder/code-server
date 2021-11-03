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
exports.getNameLocationInGlobalDirectiveComment = void 0;
const escapeRegExp_1 = require("./escapeRegExp");
// deeply re-export, for convenience
__exportStar(require("@typescript-eslint/experimental-utils/dist/ast-utils"), exports);
// The following is copied from `eslint`'s source code since it doesn't exist in eslint@5.
// https://github.com/eslint/eslint/blob/145aec1ab9052fbca96a44d04927c595951b1536/lib/rules/utils/ast-utils.js#L1751-L1779
// Could be export { getNameLocationInGlobalDirectiveComment } from 'eslint/lib/rules/utils/ast-utils'
/**
 * Get the `loc` object of a given name in a `/*globals` directive comment.
 * @param {SourceCode} sourceCode The source code to convert index to loc.
 * @param {Comment} comment The `/*globals` directive comment which include the name.
 * @param {string} name The name to find.
 * @returns {SourceLocation} The `loc` object.
 */
function getNameLocationInGlobalDirectiveComment(sourceCode, comment, name) {
    const namePattern = new RegExp(`[\\s,]${escapeRegExp_1.escapeRegExp(name)}(?:$|[\\s,:])`, 'gu');
    // To ignore the first text "global".
    namePattern.lastIndex = comment.value.indexOf('global') + 6;
    // Search a given variable name.
    const match = namePattern.exec(comment.value);
    // Convert the index to loc.
    const start = sourceCode.getLocFromIndex(comment.range[0] + '/*'.length + (match ? match.index + 1 : 0));
    const end = {
        line: start.line,
        column: start.column + (match ? name.length : 1),
    };
    return { start, end };
}
exports.getNameLocationInGlobalDirectiveComment = getNameLocationInGlobalDirectiveComment;
//# sourceMappingURL=astUtils.js.map