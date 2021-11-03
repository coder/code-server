"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const util_1 = require("../util");
exports.default = util_1.createRule({
    name: 'comma-spacing',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Enforces consistent spacing before and after commas',
            category: 'Stylistic Issues',
            recommended: false,
            extendsBaseRule: true,
        },
        fixable: 'whitespace',
        schema: [
            {
                type: 'object',
                properties: {
                    before: {
                        type: 'boolean',
                        default: false,
                    },
                    after: {
                        type: 'boolean',
                        default: true,
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unexpected: `There should be no space {{loc}} ','.`,
            missing: `A space is required {{loc}} ','.`,
        },
    },
    defaultOptions: [
        {
            before: false,
            after: true,
        },
    ],
    create(context, [{ before: spaceBefore, after: spaceAfter }]) {
        const sourceCode = context.getSourceCode();
        const tokensAndComments = sourceCode.tokensAndComments;
        const ignoredTokens = new Set();
        /**
         * Adds null elements of the ArrayExpression or ArrayPattern node to the ignore list
         * @param node node to evaluate
         */
        function addNullElementsToIgnoreList(node) {
            let previousToken = sourceCode.getFirstToken(node);
            for (const element of node.elements) {
                let token;
                if (element === null) {
                    token = sourceCode.getTokenAfter(previousToken);
                    if (token && util_1.isCommaToken(token)) {
                        ignoredTokens.add(token);
                    }
                }
                else {
                    token = sourceCode.getTokenAfter(element);
                }
                previousToken = token;
            }
        }
        /**
         * Adds type parameters trailing comma token to the ignore list
         * @param node node to evaluate
         */
        function addTypeParametersTrailingCommaToIgnoreList(node) {
            const paramLength = node.params.length;
            if (paramLength) {
                const param = node.params[paramLength - 1];
                const afterToken = sourceCode.getTokenAfter(param);
                if (afterToken && util_1.isCommaToken(afterToken)) {
                    ignoredTokens.add(afterToken);
                }
            }
        }
        /**
         * Validates the spacing around a comma token.
         * @param commaToken The token representing the comma
         * @param prevToken The last token before the comma
         * @param nextToken The first token after the comma
         */
        function validateCommaSpacing(commaToken, prevToken, nextToken) {
            if (prevToken &&
                util_1.isTokenOnSameLine(prevToken, commaToken) &&
                spaceBefore !== sourceCode.isSpaceBetweenTokens(prevToken, commaToken)) {
                context.report({
                    node: commaToken,
                    data: {
                        loc: 'before',
                    },
                    messageId: spaceBefore ? 'missing' : 'unexpected',
                    fix: fixer => spaceBefore
                        ? fixer.insertTextBefore(commaToken, ' ')
                        : fixer.replaceTextRange([prevToken.range[1], commaToken.range[0]], ''),
                });
            }
            if (nextToken && util_1.isClosingParenToken(nextToken)) {
                return;
            }
            if (!spaceAfter && nextToken && nextToken.type === experimental_utils_1.AST_TOKEN_TYPES.Line) {
                return;
            }
            if (nextToken &&
                util_1.isTokenOnSameLine(commaToken, nextToken) &&
                spaceAfter !== sourceCode.isSpaceBetweenTokens(commaToken, nextToken)) {
                context.report({
                    node: commaToken,
                    data: {
                        loc: 'after',
                    },
                    messageId: spaceAfter ? 'missing' : 'unexpected',
                    fix: fixer => spaceAfter
                        ? fixer.insertTextAfter(commaToken, ' ')
                        : fixer.replaceTextRange([commaToken.range[1], nextToken.range[0]], ''),
                });
            }
        }
        return {
            TSTypeParameterDeclaration: addTypeParametersTrailingCommaToIgnoreList,
            ArrayExpression: addNullElementsToIgnoreList,
            ArrayPattern: addNullElementsToIgnoreList,
            'Program:exit'() {
                tokensAndComments.forEach((token, i) => {
                    if (!util_1.isCommaToken(token)) {
                        return;
                    }
                    const prevToken = tokensAndComments[i - 1];
                    const nextToken = tokensAndComments[i + 1];
                    validateCommaSpacing(token, util_1.isCommaToken(prevToken) || ignoredTokens.has(token)
                        ? null
                        : prevToken, util_1.isCommaToken(nextToken) || ignoredTokens.has(token)
                        ? null
                        : nextToken);
                });
            },
        };
    },
});
//# sourceMappingURL=comma-spacing.js.map