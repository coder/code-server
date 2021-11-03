"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const no_invalid_this_1 = __importDefault(require("eslint/lib/rules/no-invalid-this"));
const util_1 = require("../util");
exports.default = util_1.createRule({
    name: 'no-invalid-this',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow `this` keywords outside of classes or class-like objects',
            category: 'Best Practices',
            recommended: false,
            extendsBaseRule: true,
        },
        messages: (_a = no_invalid_this_1.default.meta.messages) !== null && _a !== void 0 ? _a : {
            unexpectedThis: "Unexpected 'this'.",
        },
        schema: no_invalid_this_1.default.meta.schema,
    },
    defaultOptions: [{ capIsConstructor: true }],
    create(context) {
        const rules = no_invalid_this_1.default.create(context);
        /**
         * Since function definitions can be nested we use a stack storing if "this" is valid in the current context.
         *
         * Example:
         *
         * function a(this: number) { // valid "this"
         *     function b() {
         *         console.log(this); // invalid "this"
         *     }
         * }
         *
         * When parsing the function declaration of "a" the stack will be: [true]
         * When parsing the function declaration of "b" the stack will be: [true, false]
         */
        const thisIsValidStack = [];
        return Object.assign(Object.assign({}, rules), { ClassProperty() {
                thisIsValidStack.push(true);
            },
            'ClassProperty:exit'() {
                thisIsValidStack.pop();
            },
            FunctionDeclaration(node) {
                thisIsValidStack.push(node.params.some(param => param.type === experimental_utils_1.AST_NODE_TYPES.Identifier && param.name === 'this'));
                // baseRule's work
                rules.FunctionDeclaration(node);
            },
            'FunctionDeclaration:exit'(node) {
                thisIsValidStack.pop();
                // baseRule's work
                rules['FunctionDeclaration:exit'](node);
            },
            FunctionExpression(node) {
                thisIsValidStack.push(node.params.some(param => param.type === experimental_utils_1.AST_NODE_TYPES.Identifier && param.name === 'this'));
                // baseRule's work
                rules.FunctionExpression(node);
            },
            'FunctionExpression:exit'(node) {
                thisIsValidStack.pop();
                // baseRule's work
                rules['FunctionExpression:exit'](node);
            },
            ThisExpression(node) {
                const thisIsValidHere = thisIsValidStack[thisIsValidStack.length - 1];
                if (thisIsValidHere) {
                    return;
                }
                // baseRule's work
                rules.ThisExpression(node);
            } });
    },
});
//# sourceMappingURL=no-invalid-this.js.map