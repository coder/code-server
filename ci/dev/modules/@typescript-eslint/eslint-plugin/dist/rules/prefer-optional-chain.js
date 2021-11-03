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
/*
The AST is always constructed such the first element is always the deepest element.

I.e. for this code: `foo && foo.bar && foo.bar.baz && foo.bar.baz.buzz`
The AST will look like this:
{
  left: {
    left: {
      left: foo
      right: foo.bar
    }
    right: foo.bar.baz
  }
  right: foo.bar.baz.buzz
}
*/
exports.default = util.createRule({
    name: 'prefer-optional-chain',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Prefer using concise optional chain expressions instead of chained logical ands',
            category: 'Best Practices',
            recommended: false,
            suggestion: true,
        },
        messages: {
            preferOptionalChain: "Prefer using an optional chain expression instead, as it's more concise and easier to read.",
            optionalChainSuggest: 'Change to an optional chain.',
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        const sourceCode = context.getSourceCode();
        return {
            [[
                'LogicalExpression[operator="&&"] > Identifier',
                'LogicalExpression[operator="&&"] > MemberExpression',
                'LogicalExpression[operator="&&"] > ChainExpression > MemberExpression',
                'LogicalExpression[operator="&&"] > BinaryExpression[operator="!=="]',
                'LogicalExpression[operator="&&"] > BinaryExpression[operator="!="]',
            ].join(',')](initialIdentifierOrNotEqualsExpr) {
                var _a;
                // selector guarantees this cast
                const initialExpression = (((_a = initialIdentifierOrNotEqualsExpr.parent) === null || _a === void 0 ? void 0 : _a.type) ===
                    experimental_utils_1.AST_NODE_TYPES.ChainExpression
                    ? initialIdentifierOrNotEqualsExpr.parent.parent
                    : initialIdentifierOrNotEqualsExpr.parent);
                if (initialExpression.left !== initialIdentifierOrNotEqualsExpr) {
                    // the node(identifier or member expression) is not the deepest left node
                    return;
                }
                if (!isValidChainTarget(initialIdentifierOrNotEqualsExpr, true)) {
                    return;
                }
                // walk up the tree to figure out how many logical expressions we can include
                let previous = initialExpression;
                let current = initialExpression;
                let previousLeftText = getText(initialIdentifierOrNotEqualsExpr);
                let optionallyChainedCode = previousLeftText;
                let expressionCount = 1;
                while (current.type === experimental_utils_1.AST_NODE_TYPES.LogicalExpression) {
                    if (!isValidChainTarget(current.right, 
                    // only allow identifiers for the first chain - foo && foo()
                    expressionCount === 1)) {
                        break;
                    }
                    const leftText = previousLeftText;
                    const rightText = getText(current.right);
                    // can't just use startsWith because of cases like foo && fooBar.baz;
                    const matchRegex = new RegExp(`^${
                    // escape regex characters
                    leftText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-zA-Z0-9_$]`);
                    if (!matchRegex.test(rightText) &&
                        // handle redundant cases like foo.bar && foo.bar
                        leftText !== rightText) {
                        break;
                    }
                    // omit weird doubled up expression that make no sense like foo.bar && foo.bar
                    if (rightText !== leftText) {
                        expressionCount += 1;
                        previousLeftText = rightText;
                        /*
                        Diff the left and right text to construct the fix string
                        There are the following cases:
            
                        1)
                        rightText === 'foo.bar.baz.buzz'
                        leftText === 'foo.bar.baz'
                        diff === '.buzz'
            
                        2)
                        rightText === 'foo.bar.baz.buzz()'
                        leftText === 'foo.bar.baz'
                        diff === '.buzz()'
            
                        3)
                        rightText === 'foo.bar.baz.buzz()'
                        leftText === 'foo.bar.baz.buzz'
                        diff === '()'
            
                        4)
                        rightText === 'foo.bar.baz[buzz]'
                        leftText === 'foo.bar.baz'
                        diff === '[buzz]'
            
                        5)
                        rightText === 'foo.bar.baz?.buzz'
                        leftText === 'foo.bar.baz'
                        diff === '?.buzz'
                        */
                        const diff = rightText.replace(leftText, '');
                        if (diff.startsWith('?')) {
                            // item was "pre optional chained"
                            optionallyChainedCode += diff;
                        }
                        else {
                            const needsDot = diff.startsWith('(') || diff.startsWith('[');
                            optionallyChainedCode += `?${needsDot ? '.' : ''}${diff}`;
                        }
                    }
                    previous = current;
                    current = util.nullThrows(current.parent, util.NullThrowsReasons.MissingParent);
                }
                if (expressionCount > 1) {
                    if (previous.right.type === experimental_utils_1.AST_NODE_TYPES.BinaryExpression) {
                        // case like foo && foo.bar !== someValue
                        optionallyChainedCode += ` ${previous.right.operator} ${sourceCode.getText(previous.right.right)}`;
                    }
                    context.report({
                        node: previous,
                        messageId: 'preferOptionalChain',
                        suggest: [
                            {
                                messageId: 'optionalChainSuggest',
                                fix: (fixer) => [
                                    fixer.replaceText(previous, optionallyChainedCode),
                                ],
                            },
                        ],
                    });
                }
            },
        };
        function getText(node) {
            if (node.type === experimental_utils_1.AST_NODE_TYPES.BinaryExpression) {
                return getText(
                // isValidChainTarget ensures this is type safe
                node.left);
            }
            if (node.type === experimental_utils_1.AST_NODE_TYPES.CallExpression) {
                const calleeText = getText(
                // isValidChainTarget ensures this is type safe
                node.callee);
                // ensure that the call arguments are left untouched, or else we can break cases that _need_ whitespace:
                // - JSX: <Foo Needs Space Between Attrs />
                // - Unary Operators: typeof foo, await bar, delete baz
                const closingParenToken = util.nullThrows(sourceCode.getLastToken(node), util.NullThrowsReasons.MissingToken('closing parenthesis', node.type));
                const openingParenToken = util.nullThrows(sourceCode.getFirstTokenBetween(node.callee, closingParenToken, util.isOpeningParenToken), util.NullThrowsReasons.MissingToken('opening parenthesis', node.type));
                const argumentsText = sourceCode.text.substring(openingParenToken.range[0], closingParenToken.range[1]);
                return `${calleeText}${argumentsText}`;
            }
            if (node.type === experimental_utils_1.AST_NODE_TYPES.Identifier) {
                return node.name;
            }
            if (node.type === experimental_utils_1.AST_NODE_TYPES.ThisExpression) {
                return 'this';
            }
            if (node.type === experimental_utils_1.AST_NODE_TYPES.ChainExpression) {
                /* istanbul ignore if */ if (node.expression.type === experimental_utils_1.AST_NODE_TYPES.TSNonNullExpression) {
                    // this shouldn't happen
                    return '';
                }
                return getText(node.expression);
            }
            return getMemberExpressionText(node);
        }
        /**
         * Gets a normalized representation of the given MemberExpression
         */
        function getMemberExpressionText(node) {
            let objectText;
            // cases should match the list in ALLOWED_MEMBER_OBJECT_TYPES
            switch (node.object.type) {
                case experimental_utils_1.AST_NODE_TYPES.CallExpression:
                case experimental_utils_1.AST_NODE_TYPES.Identifier:
                    objectText = getText(node.object);
                    break;
                case experimental_utils_1.AST_NODE_TYPES.MemberExpression:
                    objectText = getMemberExpressionText(node.object);
                    break;
                case experimental_utils_1.AST_NODE_TYPES.ThisExpression:
                    objectText = getText(node.object);
                    break;
                /* istanbul ignore next */
                default:
                    throw new Error(`Unexpected member object type: ${node.object.type}`);
            }
            let propertyText;
            if (node.computed) {
                // cases should match the list in ALLOWED_COMPUTED_PROP_TYPES
                switch (node.property.type) {
                    case experimental_utils_1.AST_NODE_TYPES.Identifier:
                        propertyText = getText(node.property);
                        break;
                    case experimental_utils_1.AST_NODE_TYPES.Literal:
                    case experimental_utils_1.AST_NODE_TYPES.TemplateLiteral:
                        propertyText = sourceCode.getText(node.property);
                        break;
                    case experimental_utils_1.AST_NODE_TYPES.MemberExpression:
                        propertyText = getMemberExpressionText(node.property);
                        break;
                    /* istanbul ignore next */
                    default:
                        throw new Error(`Unexpected member property type: ${node.object.type}`);
                }
                return `${objectText}${node.optional ? '?.' : ''}[${propertyText}]`;
            }
            else {
                // cases should match the list in ALLOWED_NON_COMPUTED_PROP_TYPES
                switch (node.property.type) {
                    case experimental_utils_1.AST_NODE_TYPES.Identifier:
                        propertyText = getText(node.property);
                        break;
                    /* istanbul ignore next */
                    default:
                        throw new Error(`Unexpected member property type: ${node.object.type}`);
                }
                return `${objectText}${node.optional ? '?.' : '.'}${propertyText}`;
            }
        }
    },
});
const ALLOWED_MEMBER_OBJECT_TYPES = new Set([
    experimental_utils_1.AST_NODE_TYPES.CallExpression,
    experimental_utils_1.AST_NODE_TYPES.Identifier,
    experimental_utils_1.AST_NODE_TYPES.MemberExpression,
    experimental_utils_1.AST_NODE_TYPES.ThisExpression,
]);
const ALLOWED_COMPUTED_PROP_TYPES = new Set([
    experimental_utils_1.AST_NODE_TYPES.Identifier,
    experimental_utils_1.AST_NODE_TYPES.Literal,
    experimental_utils_1.AST_NODE_TYPES.MemberExpression,
    experimental_utils_1.AST_NODE_TYPES.TemplateLiteral,
]);
const ALLOWED_NON_COMPUTED_PROP_TYPES = new Set([
    experimental_utils_1.AST_NODE_TYPES.Identifier,
]);
function isValidChainTarget(node, allowIdentifier) {
    if (node.type === experimental_utils_1.AST_NODE_TYPES.ChainExpression) {
        return isValidChainTarget(node.expression, allowIdentifier);
    }
    if (node.type === experimental_utils_1.AST_NODE_TYPES.MemberExpression) {
        const isObjectValid = ALLOWED_MEMBER_OBJECT_TYPES.has(node.object.type) &&
            // make sure to validate the expression is of our expected structure
            isValidChainTarget(node.object, true);
        const isPropertyValid = node.computed
            ? ALLOWED_COMPUTED_PROP_TYPES.has(node.property.type) &&
                // make sure to validate the member expression is of our expected structure
                (node.property.type === experimental_utils_1.AST_NODE_TYPES.MemberExpression
                    ? isValidChainTarget(node.property, allowIdentifier)
                    : true)
            : ALLOWED_NON_COMPUTED_PROP_TYPES.has(node.property.type);
        return isObjectValid && isPropertyValid;
    }
    if (node.type === experimental_utils_1.AST_NODE_TYPES.CallExpression) {
        return isValidChainTarget(node.callee, allowIdentifier);
    }
    if (allowIdentifier &&
        (node.type === experimental_utils_1.AST_NODE_TYPES.Identifier ||
            node.type === experimental_utils_1.AST_NODE_TYPES.ThisExpression)) {
        return true;
    }
    /*
    special case for the following, where we only want the left
    - foo !== null
    - foo != null
    - foo !== undefined
    - foo != undefined
    */
    if (node.type === experimental_utils_1.AST_NODE_TYPES.BinaryExpression &&
        ['!==', '!='].includes(node.operator) &&
        isValidChainTarget(node.left, allowIdentifier)) {
        if (node.right.type === experimental_utils_1.AST_NODE_TYPES.Identifier &&
            node.right.name === 'undefined') {
            return true;
        }
        if (node.right.type === experimental_utils_1.AST_NODE_TYPES.Literal &&
            node.right.value === null) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=prefer-optional-chain.js.map