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
    name: 'prefer-namespace-keyword',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Require the use of the `namespace` keyword instead of the `module` keyword to declare custom TypeScript modules',
            category: 'Best Practices',
            recommended: 'error',
        },
        fixable: 'code',
        messages: {
            useNamespace: "Use 'namespace' instead of 'module' to declare custom TypeScript modules.",
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        const sourceCode = context.getSourceCode();
        return {
            TSModuleDeclaration(node) {
                // Do nothing if the name is a string.
                if (!node.id || node.id.type === experimental_utils_1.AST_NODE_TYPES.Literal) {
                    return;
                }
                // Get tokens of the declaration header.
                const moduleType = sourceCode.getTokenBefore(node.id);
                if (moduleType &&
                    moduleType.type === experimental_utils_1.AST_TOKEN_TYPES.Identifier &&
                    moduleType.value === 'module') {
                    context.report({
                        node,
                        messageId: 'useNamespace',
                        fix(fixer) {
                            return fixer.replaceText(moduleType, 'namespace');
                        },
                    });
                }
            },
        };
    },
});
//# sourceMappingURL=prefer-namespace-keyword.js.map