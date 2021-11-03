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
    name: 'no-namespace',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow the use of custom TypeScript modules and namespaces',
            category: 'Best Practices',
            recommended: 'error',
        },
        messages: {
            moduleSyntaxIsPreferred: 'ES2015 module syntax is preferred over custom TypeScript modules and namespaces.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    allowDeclarations: {
                        type: 'boolean',
                    },
                    allowDefinitionFiles: {
                        type: 'boolean',
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    defaultOptions: [
        {
            allowDeclarations: false,
            allowDefinitionFiles: true,
        },
    ],
    create(context, [{ allowDeclarations, allowDefinitionFiles }]) {
        const filename = context.getFilename();
        function isDeclaration(node) {
            var _a;
            return (node.declare === true ||
                (((_a = node.parent.parent) === null || _a === void 0 ? void 0 : _a.type) === experimental_utils_1.AST_NODE_TYPES.TSModuleDeclaration &&
                    isDeclaration(node.parent.parent)));
        }
        return {
            "TSModuleDeclaration[global!=true][id.type='Identifier']"(node) {
                if ((node.parent &&
                    node.parent.type === experimental_utils_1.AST_NODE_TYPES.TSModuleDeclaration) ||
                    (allowDefinitionFiles && util.isDefinitionFile(filename)) ||
                    (allowDeclarations && isDeclaration(node))) {
                    return;
                }
                context.report({
                    node,
                    messageId: 'moduleSyntaxIsPreferred',
                });
            },
        };
    },
});
//# sourceMappingURL=no-namespace.js.map