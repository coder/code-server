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
exports.AST_TOKEN_TYPES = exports.AST_NODE_TYPES = void 0;
var ast_spec_1 = require("./ast-spec");
Object.defineProperty(exports, "AST_NODE_TYPES", { enumerable: true, get: function () { return ast_spec_1.AST_NODE_TYPES; } });
var ast_spec_2 = require("./ast-spec");
Object.defineProperty(exports, "AST_TOKEN_TYPES", { enumerable: true, get: function () { return ast_spec_2.AST_TOKEN_TYPES; } });
__exportStar(require("./lib"), exports);
__exportStar(require("./parser-options"), exports);
__exportStar(require("./ts-estree"), exports);
//# sourceMappingURL=index.js.map