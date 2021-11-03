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
    name: 'no-unnecessary-boolean-literal-compare',
    meta: {
        docs: {
            description: 'Flags unnecessary equality comparisons against boolean literals',
            category: 'Stylistic Issues',
            recommended: false,
            requiresTypeChecking: true,
        },
        fixable: 'code',
        messages: {
            direct: 'This expression unnecessarily compares a boolean value to a boolean instead of using it directly.',
            negated: 'This expression unnecessarily compares a boolean value to a boolean instead of negating it.',
            comparingNullableToTrueDirect: 'This expression unnecessarily compares a nullable boolean value to true instead of using it directly.',
            comparingNullableToTrueNegated: 'This expression unnecessarily compares a nullable boolean value to true instead of negating it.',
            comparingNullableToFalse: 'This expression unnecessarily compares a nullable boolean value to false instead of using the ?? operator to provide a default.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    allowComparingNullableBooleansToTrue: {
                        type: 'boolean',
                    },
                    allowComparingNullableBooleansToFalse: {
                        type: 'boolean',
                    },
                },
                additionalProperties: false,
            },
        ],
        type: 'suggestion',
    },
    defaultOptions: [
        {
            allowComparingNullableBooleansToTrue: true,
            allowComparingNullableBooleansToFalse: true,
        },
    ],
    create(context, [options]) {
        const parserServices = util.getParserServices(context);
        const checker = parserServices.program.getTypeChecker();
        function getBooleanComparison(node) {
            const comparison = deconstructComparison(node);
            if (!comparison) {
                return undefined;
            }
            const expressionType = checker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(comparison.expression));
            if (isBooleanType(expressionType)) {
                return Object.assign(Object.assign({}, comparison), { expressionIsNullableBoolean: false });
            }
            if (isNullableBoolean(expressionType)) {
                return Object.assign(Object.assign({}, comparison), { expressionIsNullableBoolean: true });
            }
            return undefined;
        }
        function isBooleanType(expressionType) {
            return tsutils.isTypeFlagSet(expressionType, ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral);
        }
        /**
         * checks if the expressionType is a union that
         *   1) contains at least one nullish type (null or undefined)
         *   2) contains at least once boolean type (true or false or boolean)
         *   3) does not contain any types besides nullish and boolean types
         */
        function isNullableBoolean(expressionType) {
            if (!expressionType.isUnion()) {
                return false;
            }
            const { types } = expressionType;
            const nonNullishTypes = types.filter(type => !tsutils.isTypeFlagSet(type, ts.TypeFlags.Undefined | ts.TypeFlags.Null));
            const hasNonNullishType = nonNullishTypes.length > 0;
            if (!hasNonNullishType) {
                return false;
            }
            const hasNullableType = nonNullishTypes.length < types.length;
            if (!hasNullableType) {
                return false;
            }
            const allNonNullishTypesAreBoolean = nonNullishTypes.every(isBooleanType);
            if (!allNonNullishTypesAreBoolean) {
                return false;
            }
            return true;
        }
        function deconstructComparison(node) {
            const comparisonType = util.getEqualsKind(node.operator);
            if (!comparisonType) {
                return undefined;
            }
            for (const [against, expression] of [
                [node.right, node.left],
                [node.left, node.right],
            ]) {
                if (against.type !== experimental_utils_1.AST_NODE_TYPES.Literal ||
                    typeof against.value !== 'boolean') {
                    continue;
                }
                const { value: literalBooleanInComparison } = against;
                const negated = !comparisonType.isPositive;
                return {
                    literalBooleanInComparison,
                    forTruthy: literalBooleanInComparison ? !negated : negated,
                    expression,
                    negated,
                    range: expression.range[0] < against.range[0]
                        ? [expression.range[1], against.range[1]]
                        : [against.range[1], expression.range[1]],
                };
            }
            return undefined;
        }
        function nodeIsUnaryNegation(node) {
            return (node.type === experimental_utils_1.AST_NODE_TYPES.UnaryExpression &&
                node.prefix &&
                node.operator === '!');
        }
        return {
            BinaryExpression(node) {
                const comparison = getBooleanComparison(node);
                if (comparison === undefined) {
                    return;
                }
                if (comparison.expressionIsNullableBoolean) {
                    if (comparison.literalBooleanInComparison &&
                        options.allowComparingNullableBooleansToTrue) {
                        return;
                    }
                    if (!comparison.literalBooleanInComparison &&
                        options.allowComparingNullableBooleansToFalse) {
                        return;
                    }
                }
                context.report({
                    fix: function* (fixer) {
                        yield fixer.removeRange(comparison.range);
                        // if the expression `exp` isn't nullable, or we're comparing to `true`,
                        // we can just replace the entire comparison with `exp` or `!exp`
                        if (!comparison.expressionIsNullableBoolean ||
                            comparison.literalBooleanInComparison) {
                            if (!comparison.forTruthy) {
                                yield fixer.insertTextBefore(node, '!');
                            }
                            return;
                        }
                        // if we're here, then the expression is a nullable boolean and we're
                        // comparing to a literal `false`
                        // if we're doing `== false` or `=== false`, then we need to negate the expression
                        if (!comparison.negated) {
                            const { parent } = node;
                            // if the parent is a negation, we can instead just get rid of the parent's negation.
                            // i.e. instead of resulting in `!(!(exp))`, we can just result in `exp`
                            if (parent != null && nodeIsUnaryNegation(parent)) {
                                // remove from the beginning of the parent to the beginning of this node
                                yield fixer.removeRange([parent.range[0], node.range[0]]);
                                // remove from the end of the node to the end of the parent
                                yield fixer.removeRange([node.range[1], parent.range[1]]);
                            }
                            else {
                                yield fixer.insertTextBefore(node, '!');
                            }
                        }
                        // provide the default `true`
                        yield fixer.insertTextBefore(node, '(');
                        yield fixer.insertTextAfter(node, ' ?? true)');
                    },
                    messageId: comparison.expressionIsNullableBoolean
                        ? comparison.literalBooleanInComparison
                            ? comparison.negated
                                ? 'comparingNullableToTrueNegated'
                                : 'comparingNullableToTrueDirect'
                            : 'comparingNullableToFalse'
                        : comparison.negated
                            ? 'negated'
                            : 'direct',
                    node,
                });
            },
        };
    },
});
//# sourceMappingURL=no-unnecessary-boolean-literal-compare.js.map