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
const no_useless_constructor_1 = __importDefault(require("eslint/lib/rules/no-useless-constructor"));
const util = __importStar(require("../util"));
/**
 * Check if method with accessibility is not useless
 */
function checkAccessibility(node) {
    switch (node.accessibility) {
        case 'protected':
        case 'private':
            return false;
        case 'public':
            if (node.parent &&
                node.parent.type === experimental_utils_1.AST_NODE_TYPES.ClassBody &&
                node.parent.parent &&
                'superClass' in node.parent.parent &&
                node.parent.parent.superClass) {
                return false;
            }
            break;
    }
    return true;
}
/**
 * Check if method is not unless due to typescript parameter properties
 */
function checkParams(node) {
    return (!node.value.params ||
        !node.value.params.some(param => param.type === experimental_utils_1.AST_NODE_TYPES.TSParameterProperty));
}
exports.default = util.createRule({
    name: 'no-useless-constructor',
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow unnecessary constructors',
            category: 'Best Practices',
            recommended: false,
            extendsBaseRule: true,
        },
        schema: no_useless_constructor_1.default.meta.schema,
        messages: (_a = no_useless_constructor_1.default.meta.messages) !== null && _a !== void 0 ? _a : {
            noUselessConstructor: 'Useless constructor.',
        },
    },
    defaultOptions: [],
    create(context) {
        const rules = no_useless_constructor_1.default.create(context);
        return {
            MethodDefinition(node) {
                if (node.value &&
                    node.value.type === experimental_utils_1.AST_NODE_TYPES.FunctionExpression &&
                    node.value.body &&
                    checkAccessibility(node) &&
                    checkParams(node)) {
                    rules.MethodDefinition(node);
                }
            },
        };
    },
});
//# sourceMappingURL=no-useless-constructor.js.map