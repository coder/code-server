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
const quotes_1 = __importDefault(require("eslint/lib/rules/quotes"));
const util = __importStar(require("../util"));
exports.default = util.createRule({
    name: 'quotes',
    meta: {
        type: 'layout',
        docs: {
            description: 'Enforce the consistent use of either backticks, double, or single quotes',
            category: 'Stylistic Issues',
            recommended: false,
            extendsBaseRule: true,
        },
        fixable: 'code',
        messages: (_a = quotes_1.default.meta.messages) !== null && _a !== void 0 ? _a : {
            wrongQuotes: 'Strings must use {{description}}.',
        },
        schema: quotes_1.default.meta.schema,
    },
    defaultOptions: [
        'double',
        {
            allowTemplateLiterals: false,
            avoidEscape: false,
        },
    ],
    create(context, [option]) {
        const rules = quotes_1.default.create(context);
        function isAllowedAsNonBacktick(node) {
            const parent = node.parent;
            switch (parent === null || parent === void 0 ? void 0 : parent.type) {
                case experimental_utils_1.AST_NODE_TYPES.TSAbstractMethodDefinition:
                case experimental_utils_1.AST_NODE_TYPES.TSMethodSignature:
                case experimental_utils_1.AST_NODE_TYPES.TSPropertySignature:
                case experimental_utils_1.AST_NODE_TYPES.TSModuleDeclaration:
                case experimental_utils_1.AST_NODE_TYPES.TSLiteralType:
                case experimental_utils_1.AST_NODE_TYPES.TSExternalModuleReference:
                    return true;
                case experimental_utils_1.AST_NODE_TYPES.TSEnumMember:
                    return node === parent.id;
                case experimental_utils_1.AST_NODE_TYPES.TSAbstractClassProperty:
                case experimental_utils_1.AST_NODE_TYPES.ClassProperty:
                    return node === parent.key;
                default:
                    return false;
            }
        }
        return {
            Literal(node) {
                if (option === 'backtick' && isAllowedAsNonBacktick(node)) {
                    return;
                }
                rules.Literal(node);
            },
            TemplateLiteral(node) {
                rules.TemplateLiteral(node);
            },
        };
    },
});
//# sourceMappingURL=quotes.js.map