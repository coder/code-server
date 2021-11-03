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
const ts = __importStar(require("typescript"));
const util = __importStar(require("../util"));
exports.default = util.createRule({
    name: 'no-misused-promises',
    meta: {
        docs: {
            description: 'Avoid using promises in places not designed to handle them',
            category: 'Best Practices',
            recommended: 'error',
            requiresTypeChecking: true,
        },
        messages: {
            voidReturn: 'Promise returned in function argument where a void return was expected.',
            conditional: 'Expected non-Promise value in a boolean conditional.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    checksConditionals: {
                        type: 'boolean',
                    },
                    checksVoidReturn: {
                        type: 'boolean',
                    },
                },
            },
        ],
        type: 'problem',
    },
    defaultOptions: [
        {
            checksConditionals: true,
            checksVoidReturn: true,
        },
    ],
    create(context, [{ checksConditionals, checksVoidReturn }]) {
        const parserServices = util.getParserServices(context);
        const checker = parserServices.program.getTypeChecker();
        const checkedNodes = new Set();
        const conditionalChecks = {
            ConditionalExpression: checkTestConditional,
            DoWhileStatement: checkTestConditional,
            ForStatement: checkTestConditional,
            IfStatement: checkTestConditional,
            LogicalExpression: checkConditional,
            'UnaryExpression[operator="!"]'(node) {
                checkConditional(node.argument, true);
            },
            WhileStatement: checkTestConditional,
        };
        const voidReturnChecks = {
            CallExpression: checkArguments,
            NewExpression: checkArguments,
        };
        function checkTestConditional(node) {
            if (node.test) {
                checkConditional(node.test, true);
            }
        }
        /**
         * This function analyzes the type of a node and checks if it is a Promise in a boolean conditional.
         * It uses recursion when checking nested logical operators.
         * @param node The AST node to check.
         * @param isTestExpr Whether the node is a descendant of a test expression.
         */
        function checkConditional(node, isTestExpr = false) {
            // prevent checking the same node multiple times
            if (checkedNodes.has(node)) {
                return;
            }
            checkedNodes.add(node);
            if (node.type === experimental_utils_1.AST_NODE_TYPES.LogicalExpression) {
                // ignore the left operand for nullish coalescing expressions not in a context of a test expression
                if (node.operator !== '??' || isTestExpr) {
                    checkConditional(node.left, isTestExpr);
                }
                // we ignore the right operand when not in a context of a test expression
                if (isTestExpr) {
                    checkConditional(node.right, isTestExpr);
                }
                return;
            }
            const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
            if (isAlwaysThenable(checker, tsNode)) {
                context.report({
                    messageId: 'conditional',
                    node,
                });
            }
        }
        function checkArguments(node) {
            const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
            const voidParams = voidFunctionParams(checker, tsNode);
            if (voidParams.size === 0) {
                return;
            }
            for (const [index, argument] of node.arguments.entries()) {
                if (!voidParams.has(index)) {
                    continue;
                }
                const tsNode = parserServices.esTreeNodeToTSNodeMap.get(argument);
                if (returnsThenable(checker, tsNode)) {
                    context.report({
                        messageId: 'voidReturn',
                        node: argument,
                    });
                }
            }
        }
        return Object.assign(Object.assign({}, (checksConditionals ? conditionalChecks : {})), (checksVoidReturn ? voidReturnChecks : {}));
    },
});
// Variation on the thenable check which requires all forms of the type (read:
// alternates in a union) to be thenable. Otherwise, you might be trying to
// check if something is defined or undefined and get caught because one of the
// branches is thenable.
function isAlwaysThenable(checker, node) {
    const type = checker.getTypeAtLocation(node);
    for (const subType of tsutils.unionTypeParts(checker.getApparentType(type))) {
        const thenProp = subType.getProperty('then');
        // If one of the alternates has no then property, it is not thenable in all
        // cases.
        if (thenProp === undefined) {
            return false;
        }
        // We walk through each variation of the then property. Since we know it
        // exists at this point, we just need at least one of the alternates to
        // be of the right form to consider it thenable.
        const thenType = checker.getTypeOfSymbolAtLocation(thenProp, node);
        let hasThenableSignature = false;
        for (const subType of tsutils.unionTypeParts(thenType)) {
            for (const signature of subType.getCallSignatures()) {
                if (signature.parameters.length !== 0 &&
                    isFunctionParam(checker, signature.parameters[0], node)) {
                    hasThenableSignature = true;
                    break;
                }
            }
            // We only need to find one variant of the then property that has a
            // function signature for it to be thenable.
            if (hasThenableSignature) {
                break;
            }
        }
        // If no flavors of the then property are thenable, we don't consider the
        // overall type to be thenable
        if (!hasThenableSignature) {
            return false;
        }
    }
    // If all variants are considered thenable (i.e. haven't returned false), we
    // consider the overall type thenable
    return true;
}
function isFunctionParam(checker, param, node) {
    const type = checker.getApparentType(checker.getTypeOfSymbolAtLocation(param, node));
    for (const subType of tsutils.unionTypeParts(type)) {
        if (subType.getCallSignatures().length !== 0) {
            return true;
        }
    }
    return false;
}
// Get the positions of parameters which are void functions (and not also
// thenable functions). These are the candidates for the void-return check at
// the current call site.
function voidFunctionParams(checker, node) {
    const voidReturnIndices = new Set();
    const thenableReturnIndices = new Set();
    const type = checker.getTypeAtLocation(node.expression);
    for (const subType of tsutils.unionTypeParts(type)) {
        // Standard function calls and `new` have two different types of signatures
        const signatures = ts.isCallExpression(node)
            ? subType.getCallSignatures()
            : subType.getConstructSignatures();
        for (const signature of signatures) {
            for (const [index, parameter] of signature.parameters.entries()) {
                const type = checker.getTypeOfSymbolAtLocation(parameter, node.expression);
                for (const subType of tsutils.unionTypeParts(type)) {
                    for (const signature of subType.getCallSignatures()) {
                        const returnType = signature.getReturnType();
                        if (tsutils.isTypeFlagSet(returnType, ts.TypeFlags.Void)) {
                            voidReturnIndices.add(index);
                        }
                        else if (tsutils.isThenableType(checker, node.expression, returnType)) {
                            thenableReturnIndices.add(index);
                        }
                    }
                }
            }
        }
    }
    // If a certain positional argument accepts both thenable and void returns,
    // a promise-returning function is valid
    for (const thenable of thenableReturnIndices) {
        voidReturnIndices.delete(thenable);
    }
    return voidReturnIndices;
}
// Returns true if the expression is a function that returns a thenable
function returnsThenable(checker, node) {
    const type = checker.getApparentType(checker.getTypeAtLocation(node));
    for (const subType of tsutils.unionTypeParts(type)) {
        for (const signature of subType.getCallSignatures()) {
            const returnType = signature.getReturnType();
            if (tsutils.isThenableType(checker, node, returnType)) {
                return true;
            }
        }
    }
    return false;
}
//# sourceMappingURL=no-misused-promises.js.map