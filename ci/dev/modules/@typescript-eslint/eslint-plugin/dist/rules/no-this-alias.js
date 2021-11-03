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
    name: 'no-this-alias',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow aliasing `this`',
            category: 'Best Practices',
            recommended: 'error',
        },
        schema: [
            {
                type: 'object',
                additionalProperties: false,
                properties: {
                    allowDestructuring: {
                        type: 'boolean',
                    },
                    allowedNames: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                    },
                },
            },
        ],
        messages: {
            thisAssignment: "Unexpected aliasing of 'this' to local variable.",
            thisDestructure: "Unexpected aliasing of members of 'this' to local variables.",
        },
    },
    defaultOptions: [
        {
            allowDestructuring: true,
            allowedNames: [],
        },
    ],
    create(context, [{ allowDestructuring, allowedNames }]) {
        return {
            "VariableDeclarator[init.type='ThisExpression']"(node) {
                const { id } = node;
                if (allowDestructuring && id.type !== experimental_utils_1.AST_NODE_TYPES.Identifier) {
                    return;
                }
                const hasAllowedName = id.type === experimental_utils_1.AST_NODE_TYPES.Identifier
                    ? allowedNames.includes(id.name)
                    : false;
                if (!hasAllowedName) {
                    context.report({
                        node: id,
                        messageId: id.type === experimental_utils_1.AST_NODE_TYPES.Identifier
                            ? 'thisAssignment'
                            : 'thisDestructure',
                    });
                }
            },
        };
    },
});
//# sourceMappingURL=no-this-alias.js.map