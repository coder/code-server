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
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const util = __importStar(require("../util"));
exports.default = util.createRule({
    name: 'no-var-requires',
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallows the use of require statements except in import statements',
            category: 'Best Practices',
            recommended: 'error',
        },
        messages: {
            noVarReqs: 'Require statement not part of import statement.',
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        return {
            CallExpression(node) {
                var _a;
                const parent = ((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type) === experimental_utils_1.AST_NODE_TYPES.ChainExpression
                    ? node.parent.parent
                    : node.parent;
                if (node.callee.type === experimental_utils_1.AST_NODE_TYPES.Identifier &&
                    node.callee.name === 'require' &&
                    parent &&
                    (parent.type === experimental_utils_1.AST_NODE_TYPES.VariableDeclarator ||
                        parent.type === experimental_utils_1.AST_NODE_TYPES.CallExpression ||
                        parent.type === experimental_utils_1.AST_NODE_TYPES.TSAsExpression ||
                        parent.type === experimental_utils_1.AST_NODE_TYPES.TSTypeAssertion ||
                        parent.type === experimental_utils_1.AST_NODE_TYPES.MemberExpression)) {
                    context.report({
                        node,
                        messageId: 'noVarReqs',
                    });
                }
            },
        };
    },
});
//# sourceMappingURL=no-var-requires.js.map