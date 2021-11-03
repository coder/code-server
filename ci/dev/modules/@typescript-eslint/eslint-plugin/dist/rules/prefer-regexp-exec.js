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
const tsutils = __importStar(require("tsutils"));
const util_1 = require("../util");
var ArgumentType;
(function (ArgumentType) {
    ArgumentType[ArgumentType["Other"] = 0] = "Other";
    ArgumentType[ArgumentType["String"] = 1] = "String";
    ArgumentType[ArgumentType["RegExp"] = 2] = "RegExp";
    ArgumentType[ArgumentType["Both"] = 3] = "Both";
})(ArgumentType || (ArgumentType = {}));
exports.default = util_1.createRule({
    name: 'prefer-regexp-exec',
    defaultOptions: [],
    meta: {
        type: 'suggestion',
        fixable: 'code',
        docs: {
            description: 'Enforce that `RegExp#exec` is used instead of `String#match` if no global flag is provided',
            category: 'Best Practices',
            recommended: 'error',
            requiresTypeChecking: true,
        },
        messages: {
            regExpExecOverStringMatch: 'Use the `RegExp#exec()` method instead.',
        },
        schema: [],
    },
    create(context) {
        const globalScope = context.getScope();
        const parserServices = util_1.getParserServices(context);
        const typeChecker = parserServices.program.getTypeChecker();
        const sourceCode = context.getSourceCode();
        /**
         * Check if a given node type is a string.
         * @param node The node type to check.
         */
        function isStringType(type) {
            return util_1.getTypeName(typeChecker, type) === 'string';
        }
        /**
         * Check if a given node type is a RegExp.
         * @param node The node type to check.
         */
        function isRegExpType(type) {
            return util_1.getTypeName(typeChecker, type) === 'RegExp';
        }
        function collectArgumentTypes(types) {
            let result = ArgumentType.Other;
            for (const type of types) {
                if (isRegExpType(type)) {
                    result |= ArgumentType.RegExp;
                }
                else if (isStringType(type)) {
                    result |= ArgumentType.String;
                }
            }
            return result;
        }
        return {
            "CallExpression[arguments.length=1] > MemberExpression.callee[property.name='match'][computed=false]"(memberNode) {
                const objectNode = memberNode.object;
                const callNode = memberNode.parent;
                const argumentNode = callNode.arguments[0];
                const argumentValue = util_1.getStaticValue(argumentNode, globalScope);
                if (!isStringType(typeChecker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(objectNode)))) {
                    return;
                }
                // Don't report regular expressions with global flag.
                if (argumentValue &&
                    argumentValue.value instanceof RegExp &&
                    argumentValue.value.flags.includes('g')) {
                    return;
                }
                if (argumentNode.type === experimental_utils_1.AST_NODE_TYPES.Literal &&
                    typeof argumentNode.value == 'string') {
                    const regExp = RegExp(argumentNode.value);
                    return context.report({
                        node: memberNode.property,
                        messageId: 'regExpExecOverStringMatch',
                        fix: util_1.getWrappingFixer({
                            sourceCode,
                            node: callNode,
                            innerNode: [objectNode],
                            wrap: objectCode => `${regExp.toString()}.exec(${objectCode})`,
                        }),
                    });
                }
                const argumentType = typeChecker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(argumentNode));
                const argumentTypes = collectArgumentTypes(tsutils.unionTypeParts(argumentType));
                switch (argumentTypes) {
                    case ArgumentType.RegExp:
                        return context.report({
                            node: memberNode.property,
                            messageId: 'regExpExecOverStringMatch',
                            fix: util_1.getWrappingFixer({
                                sourceCode,
                                node: callNode,
                                innerNode: [objectNode, argumentNode],
                                wrap: (objectCode, argumentCode) => `${argumentCode}.exec(${objectCode})`,
                            }),
                        });
                    case ArgumentType.String:
                        return context.report({
                            node: memberNode.property,
                            messageId: 'regExpExecOverStringMatch',
                            fix: util_1.getWrappingFixer({
                                sourceCode,
                                node: callNode,
                                innerNode: [objectNode, argumentNode],
                                wrap: (objectCode, argumentCode) => `RegExp(${argumentCode}).exec(${objectCode})`,
                            }),
                        });
                }
            },
        };
    },
});
//# sourceMappingURL=prefer-regexp-exec.js.map