"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const init_declarations_1 = __importDefault(require("eslint/lib/rules/init-declarations"));
const util_1 = require("../util");
exports.default = util_1.createRule({
    name: 'init-declarations',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'require or disallow initialization in variable declarations',
            category: 'Variables',
            recommended: false,
            extendsBaseRule: true,
        },
        schema: init_declarations_1.default.meta.schema,
        messages: (_a = init_declarations_1.default.meta.messages) !== null && _a !== void 0 ? _a : {
            initialized: "Variable '{{idName}}' should be initialized on declaration.",
            notInitialized: "Variable '{{idName}}' should not be initialized on declaration.",
        },
    },
    defaultOptions: ['always'],
    create(context) {
        const rules = init_declarations_1.default.create(context);
        const mode = context.options[0] || 'always';
        return {
            'VariableDeclaration:exit'(node) {
                var _a, _b, _c;
                if (mode === 'always') {
                    if (node.declare) {
                        return;
                    }
                    if (((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type) === experimental_utils_1.AST_NODE_TYPES.TSModuleBlock &&
                        ((_b = node.parent.parent) === null || _b === void 0 ? void 0 : _b.type) === experimental_utils_1.AST_NODE_TYPES.TSModuleDeclaration &&
                        ((_c = node.parent.parent) === null || _c === void 0 ? void 0 : _c.declare)) {
                        return;
                    }
                }
                rules['VariableDeclaration:exit'](node);
            },
        };
    },
});
//# sourceMappingURL=init-declarations.js.map