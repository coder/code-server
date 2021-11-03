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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const no_unused_expressions_1 = __importDefault(require("eslint/lib/rules/no-unused-expressions"));
const util = __importStar(require("../util"));
exports.default = util.createRule({
    name: 'no-unused-expressions',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow unused expressions',
            category: 'Best Practices',
            recommended: false,
            extendsBaseRule: true,
        },
        schema: no_unused_expressions_1.default.meta.schema,
        messages: (_a = no_unused_expressions_1.default.meta.messages) !== null && _a !== void 0 ? _a : {
            unusedExpression: 'Expected an assignment or function call and instead saw an expression.',
        },
    },
    defaultOptions: [
        {
            allowShortCircuit: false,
            allowTernary: false,
            allowTaggedTemplates: false,
        },
    ],
    create(context, options) {
        const rules = no_unused_expressions_1.default.create(context);
        const { allowShortCircuit = false, allowTernary = false } = options[0];
        function isValidExpression(node) {
            if (allowShortCircuit && node.type === experimental_utils_1.AST_NODE_TYPES.LogicalExpression) {
                return isValidExpression(node.right);
            }
            if (allowTernary && node.type === experimental_utils_1.AST_NODE_TYPES.ConditionalExpression) {
                return (isValidExpression(node.alternate) &&
                    isValidExpression(node.consequent));
            }
            return ((node.type === experimental_utils_1.AST_NODE_TYPES.ChainExpression &&
                node.expression.type === experimental_utils_1.AST_NODE_TYPES.CallExpression) ||
                node.type === experimental_utils_1.AST_NODE_TYPES.ImportExpression);
        }
        return {
            ExpressionStatement(node) {
                if (node.directive || isValidExpression(node.expression)) {
                    return;
                }
                rules.ExpressionStatement(node);
            },
        };
    },
});
//# sourceMappingURL=no-unused-expressions.js.map