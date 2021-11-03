"use strict";
//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const OffsetStorage_1 = require("./OffsetStorage");
const TokenInfo_1 = require("./TokenInfo");
const util_1 = require("../../util");
const GLOBAL_LINEBREAK_REGEX = /\r\n|[\r\n\u2028\u2029]/gu;
const WHITESPACE_REGEX = /\s*$/u;
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
const KNOWN_NODES = new Set([
    experimental_utils_1.AST_NODE_TYPES.AssignmentExpression,
    experimental_utils_1.AST_NODE_TYPES.AssignmentPattern,
    experimental_utils_1.AST_NODE_TYPES.ArrayExpression,
    experimental_utils_1.AST_NODE_TYPES.ArrayPattern,
    experimental_utils_1.AST_NODE_TYPES.ArrowFunctionExpression,
    experimental_utils_1.AST_NODE_TYPES.AwaitExpression,
    experimental_utils_1.AST_NODE_TYPES.BlockStatement,
    experimental_utils_1.AST_NODE_TYPES.BinaryExpression,
    experimental_utils_1.AST_NODE_TYPES.BreakStatement,
    experimental_utils_1.AST_NODE_TYPES.CallExpression,
    experimental_utils_1.AST_NODE_TYPES.CatchClause,
    experimental_utils_1.AST_NODE_TYPES.ClassBody,
    experimental_utils_1.AST_NODE_TYPES.ClassDeclaration,
    experimental_utils_1.AST_NODE_TYPES.ClassExpression,
    experimental_utils_1.AST_NODE_TYPES.ConditionalExpression,
    experimental_utils_1.AST_NODE_TYPES.ContinueStatement,
    experimental_utils_1.AST_NODE_TYPES.DoWhileStatement,
    experimental_utils_1.AST_NODE_TYPES.DebuggerStatement,
    experimental_utils_1.AST_NODE_TYPES.EmptyStatement,
    experimental_utils_1.AST_NODE_TYPES.ExpressionStatement,
    experimental_utils_1.AST_NODE_TYPES.ForStatement,
    experimental_utils_1.AST_NODE_TYPES.ForInStatement,
    experimental_utils_1.AST_NODE_TYPES.ForOfStatement,
    experimental_utils_1.AST_NODE_TYPES.FunctionDeclaration,
    experimental_utils_1.AST_NODE_TYPES.FunctionExpression,
    experimental_utils_1.AST_NODE_TYPES.Identifier,
    experimental_utils_1.AST_NODE_TYPES.IfStatement,
    experimental_utils_1.AST_NODE_TYPES.Literal,
    experimental_utils_1.AST_NODE_TYPES.LabeledStatement,
    experimental_utils_1.AST_NODE_TYPES.LogicalExpression,
    experimental_utils_1.AST_NODE_TYPES.MemberExpression,
    experimental_utils_1.AST_NODE_TYPES.MetaProperty,
    experimental_utils_1.AST_NODE_TYPES.MethodDefinition,
    experimental_utils_1.AST_NODE_TYPES.NewExpression,
    experimental_utils_1.AST_NODE_TYPES.ObjectExpression,
    experimental_utils_1.AST_NODE_TYPES.ObjectPattern,
    experimental_utils_1.AST_NODE_TYPES.Program,
    experimental_utils_1.AST_NODE_TYPES.Property,
    experimental_utils_1.AST_NODE_TYPES.RestElement,
    experimental_utils_1.AST_NODE_TYPES.ReturnStatement,
    experimental_utils_1.AST_NODE_TYPES.SequenceExpression,
    experimental_utils_1.AST_NODE_TYPES.SpreadElement,
    experimental_utils_1.AST_NODE_TYPES.Super,
    experimental_utils_1.AST_NODE_TYPES.SwitchCase,
    experimental_utils_1.AST_NODE_TYPES.SwitchStatement,
    experimental_utils_1.AST_NODE_TYPES.TaggedTemplateExpression,
    experimental_utils_1.AST_NODE_TYPES.TemplateElement,
    experimental_utils_1.AST_NODE_TYPES.TemplateLiteral,
    experimental_utils_1.AST_NODE_TYPES.ThisExpression,
    experimental_utils_1.AST_NODE_TYPES.ThrowStatement,
    experimental_utils_1.AST_NODE_TYPES.TryStatement,
    experimental_utils_1.AST_NODE_TYPES.UnaryExpression,
    experimental_utils_1.AST_NODE_TYPES.UpdateExpression,
    experimental_utils_1.AST_NODE_TYPES.VariableDeclaration,
    experimental_utils_1.AST_NODE_TYPES.VariableDeclarator,
    experimental_utils_1.AST_NODE_TYPES.WhileStatement,
    experimental_utils_1.AST_NODE_TYPES.WithStatement,
    experimental_utils_1.AST_NODE_TYPES.YieldExpression,
    experimental_utils_1.AST_NODE_TYPES.JSXIdentifier,
    experimental_utils_1.AST_NODE_TYPES.JSXMemberExpression,
    experimental_utils_1.AST_NODE_TYPES.JSXEmptyExpression,
    experimental_utils_1.AST_NODE_TYPES.JSXExpressionContainer,
    experimental_utils_1.AST_NODE_TYPES.JSXElement,
    experimental_utils_1.AST_NODE_TYPES.JSXClosingElement,
    experimental_utils_1.AST_NODE_TYPES.JSXOpeningElement,
    experimental_utils_1.AST_NODE_TYPES.JSXAttribute,
    experimental_utils_1.AST_NODE_TYPES.JSXSpreadAttribute,
    experimental_utils_1.AST_NODE_TYPES.JSXText,
    experimental_utils_1.AST_NODE_TYPES.ExportDefaultDeclaration,
    experimental_utils_1.AST_NODE_TYPES.ExportNamedDeclaration,
    experimental_utils_1.AST_NODE_TYPES.ExportAllDeclaration,
    experimental_utils_1.AST_NODE_TYPES.ExportSpecifier,
    experimental_utils_1.AST_NODE_TYPES.ImportDeclaration,
    experimental_utils_1.AST_NODE_TYPES.ImportSpecifier,
    experimental_utils_1.AST_NODE_TYPES.ImportDefaultSpecifier,
    experimental_utils_1.AST_NODE_TYPES.ImportNamespaceSpecifier,
    // Class properties aren't yet supported by eslint...
    experimental_utils_1.AST_NODE_TYPES.ClassProperty,
    // ts keywords
    experimental_utils_1.AST_NODE_TYPES.TSAbstractKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSAnyKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSBooleanKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSNeverKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSNumberKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSStringKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSSymbolKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSUndefinedKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSUnknownKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSVoidKeyword,
    experimental_utils_1.AST_NODE_TYPES.TSNullKeyword,
    // ts specific nodes we want to support
    experimental_utils_1.AST_NODE_TYPES.TSAbstractClassProperty,
    experimental_utils_1.AST_NODE_TYPES.TSAbstractMethodDefinition,
    experimental_utils_1.AST_NODE_TYPES.TSArrayType,
    experimental_utils_1.AST_NODE_TYPES.TSAsExpression,
    experimental_utils_1.AST_NODE_TYPES.TSCallSignatureDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSConditionalType,
    experimental_utils_1.AST_NODE_TYPES.TSConstructorType,
    experimental_utils_1.AST_NODE_TYPES.TSConstructSignatureDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSDeclareFunction,
    experimental_utils_1.AST_NODE_TYPES.TSEmptyBodyFunctionExpression,
    experimental_utils_1.AST_NODE_TYPES.TSEnumDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSEnumMember,
    experimental_utils_1.AST_NODE_TYPES.TSExportAssignment,
    experimental_utils_1.AST_NODE_TYPES.TSExternalModuleReference,
    experimental_utils_1.AST_NODE_TYPES.TSFunctionType,
    experimental_utils_1.AST_NODE_TYPES.TSImportType,
    experimental_utils_1.AST_NODE_TYPES.TSIndexedAccessType,
    experimental_utils_1.AST_NODE_TYPES.TSIndexSignature,
    experimental_utils_1.AST_NODE_TYPES.TSInferType,
    experimental_utils_1.AST_NODE_TYPES.TSInterfaceBody,
    experimental_utils_1.AST_NODE_TYPES.TSInterfaceDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSInterfaceHeritage,
    experimental_utils_1.AST_NODE_TYPES.TSIntersectionType,
    experimental_utils_1.AST_NODE_TYPES.TSImportEqualsDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSLiteralType,
    experimental_utils_1.AST_NODE_TYPES.TSMappedType,
    experimental_utils_1.AST_NODE_TYPES.TSMethodSignature,
    'TSMinusToken',
    experimental_utils_1.AST_NODE_TYPES.TSModuleBlock,
    experimental_utils_1.AST_NODE_TYPES.TSModuleDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSNonNullExpression,
    experimental_utils_1.AST_NODE_TYPES.TSParameterProperty,
    experimental_utils_1.AST_NODE_TYPES.TSParenthesizedType,
    'TSPlusToken',
    experimental_utils_1.AST_NODE_TYPES.TSPropertySignature,
    experimental_utils_1.AST_NODE_TYPES.TSQualifiedName,
    'TSQuestionToken',
    experimental_utils_1.AST_NODE_TYPES.TSRestType,
    experimental_utils_1.AST_NODE_TYPES.TSThisType,
    experimental_utils_1.AST_NODE_TYPES.TSTupleType,
    experimental_utils_1.AST_NODE_TYPES.TSTypeAnnotation,
    experimental_utils_1.AST_NODE_TYPES.TSTypeLiteral,
    experimental_utils_1.AST_NODE_TYPES.TSTypeOperator,
    experimental_utils_1.AST_NODE_TYPES.TSTypeParameter,
    experimental_utils_1.AST_NODE_TYPES.TSTypeParameterDeclaration,
    experimental_utils_1.AST_NODE_TYPES.TSTypeParameterInstantiation,
    experimental_utils_1.AST_NODE_TYPES.TSTypeReference,
    experimental_utils_1.AST_NODE_TYPES.TSUnionType,
]);
const STATEMENT_LIST_PARENTS = new Set([
    experimental_utils_1.AST_NODE_TYPES.Program,
    experimental_utils_1.AST_NODE_TYPES.BlockStatement,
    experimental_utils_1.AST_NODE_TYPES.SwitchCase,
]);
const DEFAULT_VARIABLE_INDENT = 1;
const DEFAULT_PARAMETER_INDENT = 1;
const DEFAULT_FUNCTION_BODY_INDENT = 1;
/*
 * General rule strategy:
 * 1. An OffsetStorage instance stores a map of desired offsets, where each token has a specified offset from another
 *    specified token or to the first column.
 * 2. As the AST is traversed, modify the desired offsets of tokens accordingly. For example, when entering a
 *    BlockStatement, offset all of the tokens in the BlockStatement by 1 indent level from the opening curly
 *    brace of the BlockStatement.
 * 3. After traversing the AST, calculate the expected indentation levels of every token according to the
 *    OffsetStorage container.
 * 4. For each line, compare the expected indentation of the first token to the actual indentation in the file,
 *    and report the token if the two values are not equal.
 */
const ELEMENT_LIST_SCHEMA = {
    oneOf: [
        {
            type: 'integer',
            minimum: 0,
        },
        {
            enum: ['first', 'off'],
        },
    ],
};
exports.default = util_1.createRule({
    name: 'indent',
    meta: {
        type: 'layout',
        docs: {
            description: 'Enforce consistent indentation.',
            category: 'Stylistic Issues',
            recommended: false,
        },
        fixable: 'whitespace',
        schema: [
            {
                oneOf: [
                    {
                        enum: ['tab'],
                    },
                    {
                        type: 'integer',
                        minimum: 0,
                    },
                ],
            },
            {
                type: 'object',
                properties: {
                    SwitchCase: {
                        type: 'integer',
                        minimum: 0,
                        default: 0,
                    },
                    VariableDeclarator: {
                        oneOf: [
                            ELEMENT_LIST_SCHEMA,
                            {
                                type: 'object',
                                properties: {
                                    var: ELEMENT_LIST_SCHEMA,
                                    let: ELEMENT_LIST_SCHEMA,
                                    const: ELEMENT_LIST_SCHEMA,
                                },
                                additionalProperties: false,
                            },
                        ],
                    },
                    outerIIFEBody: {
                        type: 'integer',
                        minimum: 0,
                    },
                    MemberExpression: {
                        oneOf: [
                            {
                                type: 'integer',
                                minimum: 0,
                            },
                            {
                                enum: ['off'],
                            },
                        ],
                    },
                    FunctionDeclaration: {
                        type: 'object',
                        properties: {
                            parameters: ELEMENT_LIST_SCHEMA,
                            body: {
                                type: 'integer',
                                minimum: 0,
                            },
                        },
                        additionalProperties: false,
                    },
                    FunctionExpression: {
                        type: 'object',
                        properties: {
                            parameters: ELEMENT_LIST_SCHEMA,
                            body: {
                                type: 'integer',
                                minimum: 0,
                            },
                        },
                        additionalProperties: false,
                    },
                    CallExpression: {
                        type: 'object',
                        properties: {
                            arguments: ELEMENT_LIST_SCHEMA,
                        },
                        additionalProperties: false,
                    },
                    ArrayExpression: ELEMENT_LIST_SCHEMA,
                    ObjectExpression: ELEMENT_LIST_SCHEMA,
                    ImportDeclaration: ELEMENT_LIST_SCHEMA,
                    flatTernaryExpressions: {
                        type: 'boolean',
                        default: false,
                    },
                    ignoredNodes: {
                        type: 'array',
                        items: {
                            type: 'string',
                            not: {
                                pattern: ':exit$',
                            },
                        },
                    },
                    ignoreComments: {
                        type: 'boolean',
                        default: false,
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            wrongIndentation: 'Expected indentation of {{expected}} but found {{actual}}.',
        },
    },
    defaultOptions: [
        // typescript docs and playground use 4 space indent
        4,
        {
            // typescript docs indent the case from the switch
            // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-1-8.html#example-4
            SwitchCase: 1,
            VariableDeclarator: {
                var: DEFAULT_VARIABLE_INDENT,
                let: DEFAULT_VARIABLE_INDENT,
                const: DEFAULT_VARIABLE_INDENT,
            },
            outerIIFEBody: 1,
            FunctionDeclaration: {
                parameters: DEFAULT_PARAMETER_INDENT,
                body: DEFAULT_FUNCTION_BODY_INDENT,
            },
            FunctionExpression: {
                parameters: DEFAULT_PARAMETER_INDENT,
                body: DEFAULT_FUNCTION_BODY_INDENT,
            },
            CallExpression: {
                arguments: DEFAULT_PARAMETER_INDENT,
            },
            MemberExpression: 1,
            ArrayExpression: 1,
            ObjectExpression: 1,
            ImportDeclaration: 1,
            flatTernaryExpressions: false,
            ignoredNodes: [],
            ignoreComments: false,
        },
    ],
    create(context, [userIndent, userOptions]) {
        const indentType = userIndent === 'tab' ? 'tab' : 'space';
        const indentSize = userIndent === 'tab' ? 1 : userIndent;
        const options = userOptions;
        if (typeof userOptions.VariableDeclarator === 'number' ||
            userOptions.VariableDeclarator === 'first') {
            // typescript doesn't narrow the type for some reason
            options.VariableDeclarator = {
                var: userOptions.VariableDeclarator,
                let: userOptions.VariableDeclarator,
                const: userOptions.VariableDeclarator,
            };
        }
        const sourceCode = context.getSourceCode();
        const tokenInfo = new TokenInfo_1.TokenInfo(sourceCode);
        const offsets = new OffsetStorage_1.OffsetStorage(tokenInfo, indentSize, indentType === 'space' ? ' ' : '\t');
        const parameterParens = new WeakSet();
        /**
         * Creates an error message for a line, given the expected/actual indentation.
         * @param expectedAmount The expected amount of indentation characters for this line
         * @param actualSpaces The actual number of indentation spaces that were found on this line
         * @param actualTabs The actual number of indentation tabs that were found on this line
         * @returns An error message for this line
         */
        function createErrorMessageData(expectedAmount, actualSpaces, actualTabs) {
            const expectedStatement = `${expectedAmount} ${indentType}${expectedAmount === 1 ? '' : 's'}`; // e.g. "2 tabs"
            const foundSpacesWord = `space${actualSpaces === 1 ? '' : 's'}`; // e.g. "space"
            const foundTabsWord = `tab${actualTabs === 1 ? '' : 's'}`; // e.g. "tabs"
            let foundStatement;
            if (actualSpaces > 0) {
                /*
                 * Abbreviate the message if the expected indentation is also spaces.
                 * e.g. 'Expected 4 spaces but found 2' rather than 'Expected 4 spaces but found 2 spaces'
                 */
                foundStatement =
                    indentType === 'space'
                        ? actualSpaces
                        : `${actualSpaces} ${foundSpacesWord}`;
            }
            else if (actualTabs > 0) {
                foundStatement =
                    indentType === 'tab' ? actualTabs : `${actualTabs} ${foundTabsWord}`;
            }
            else {
                foundStatement = '0';
            }
            return {
                expected: expectedStatement,
                actual: foundStatement,
            };
        }
        /**
         * Reports a given indent violation
         * @param token Token violating the indent rule
         * @param neededIndent Expected indentation string
         */
        function report(token, neededIndent) {
            const actualIndent = Array.from(tokenInfo.getTokenIndent(token));
            const numSpaces = actualIndent.filter(char => char === ' ').length;
            const numTabs = actualIndent.filter(char => char === '\t').length;
            context.report({
                node: token,
                messageId: 'wrongIndentation',
                data: createErrorMessageData(neededIndent.length, numSpaces, numTabs),
                loc: {
                    start: { line: token.loc.start.line, column: 0 },
                    end: { line: token.loc.start.line, column: token.loc.start.column },
                },
                fix(fixer) {
                    return fixer.replaceTextRange([token.range[0] - token.loc.start.column, token.range[0]], neededIndent);
                },
            });
        }
        /**
         * Checks if a token's indentation is correct
         * @param token Token to examine
         * @param desiredIndent Desired indentation of the string
         * @returns `true` if the token's indentation is correct
         */
        function validateTokenIndent(token, desiredIndent) {
            const indentation = tokenInfo.getTokenIndent(token);
            return (indentation === desiredIndent ||
                // To avoid conflicts with no-mixed-spaces-and-tabs, don't report mixed spaces and tabs.
                (indentation.includes(' ') && indentation.includes('\t')));
        }
        /**
         * Check to see if the node is a file level IIFE
         * @param node The function node to check.
         * @returns True if the node is the outer IIFE
         */
        function isOuterIIFE(node) {
            var _a;
            /*
             * Verify that the node is an IIFE
             */
            if (!node.parent ||
                node.parent.type !== experimental_utils_1.AST_NODE_TYPES.CallExpression ||
                node.parent.callee !== node) {
                return false;
            }
            /*
             * Navigate legal ancestors to determine whether this IIFE is outer.
             * A "legal ancestor" is an expression or statement that causes the function to get executed immediately.
             * For example, `!(function(){})()` is an outer IIFE even though it is preceded by a ! operator.
             */
            let statement = (_a = node.parent) === null || _a === void 0 ? void 0 : _a.parent;
            while (statement &&
                ((statement.type === experimental_utils_1.AST_NODE_TYPES.UnaryExpression &&
                    ['!', '~', '+', '-'].includes(statement.operator)) ||
                    statement.type === experimental_utils_1.AST_NODE_TYPES.AssignmentExpression ||
                    statement.type === experimental_utils_1.AST_NODE_TYPES.LogicalExpression ||
                    statement.type === experimental_utils_1.AST_NODE_TYPES.SequenceExpression ||
                    statement.type === experimental_utils_1.AST_NODE_TYPES.VariableDeclarator)) {
                statement = statement.parent;
            }
            return (!!statement &&
                (statement.type === experimental_utils_1.AST_NODE_TYPES.ExpressionStatement ||
                    statement.type === experimental_utils_1.AST_NODE_TYPES.VariableDeclaration) &&
                !!statement.parent &&
                statement.parent.type === experimental_utils_1.AST_NODE_TYPES.Program);
        }
        /**
         * Counts the number of linebreaks that follow the last non-whitespace character in a string
         * @param str The string to check
         * @returns The number of JavaScript linebreaks that follow the last non-whitespace character,
         *          or the total number of linebreaks if the string is all whitespace.
         */
        function countTrailingLinebreaks(str) {
            const trailingWhitespace = WHITESPACE_REGEX.exec(str)[0];
            const linebreakMatches = GLOBAL_LINEBREAK_REGEX.exec(trailingWhitespace);
            return linebreakMatches === null ? 0 : linebreakMatches.length;
        }
        /**
         * Check indentation for lists of elements (arrays, objects, function params)
         * @param elements List of elements that should be offset
         * @param startToken The start token of the list that element should be aligned against, e.g. '['
         * @param endToken The end token of the list, e.g. ']'
         * @param offset The amount that the elements should be offset
         */
        function addElementListIndent(elements, startToken, endToken, offset) {
            /**
             * Gets the first token of a given element, including surrounding parentheses.
             * @param element A node in the `elements` list
             * @returns The first token of this element
             */
            function getFirstToken(element) {
                let token = sourceCode.getTokenBefore(element);
                while (util_1.isOpeningParenToken(token) && token !== startToken) {
                    token = sourceCode.getTokenBefore(token);
                }
                return sourceCode.getTokenAfter(token);
            }
            // Run through all the tokens in the list, and offset them by one indent level (mainly for comments, other things will end up overridden)
            offsets.setDesiredOffsets([startToken.range[1], endToken.range[0]], startToken, typeof offset === 'number' ? offset : 1);
            offsets.setDesiredOffset(endToken, startToken, 0);
            // If the preference is "first" but there is no first element (e.g. sparse arrays w/ empty first slot), fall back to 1 level.
            const firstElement = elements[0];
            if (offset === 'first' && elements.length && !firstElement) {
                return;
            }
            elements.forEach((element, index) => {
                if (!element) {
                    // Skip holes in arrays
                    return;
                }
                if (offset === 'off') {
                    // Ignore the first token of every element if the "off" option is used
                    offsets.ignoreToken(getFirstToken(element));
                }
                // Offset the following elements correctly relative to the first element
                if (index === 0) {
                    return;
                }
                if (offset === 'first' &&
                    tokenInfo.isFirstTokenOfLine(getFirstToken(element))) {
                    offsets.matchOffsetOf(getFirstToken(firstElement), getFirstToken(element));
                }
                else {
                    const previousElement = elements[index - 1];
                    const firstTokenOfPreviousElement = previousElement && getFirstToken(previousElement);
                    const previousElementLastToken = previousElement && sourceCode.getLastToken(previousElement);
                    if (previousElement &&
                        previousElementLastToken &&
                        previousElementLastToken.loc.end.line -
                            countTrailingLinebreaks(previousElementLastToken.value) >
                            startToken.loc.end.line) {
                        offsets.setDesiredOffsets([previousElement.range[1], element.range[1]], firstTokenOfPreviousElement, 0);
                    }
                }
            });
        }
        /**
         * Check and decide whether to check for indentation for blockless nodes
         * Scenarios are for or while statements without braces around them
         */
        function addBlocklessNodeIndent(node) {
            if (node.type !== experimental_utils_1.AST_NODE_TYPES.BlockStatement) {
                const lastParentToken = sourceCode.getTokenBefore(node, util_1.isNotOpeningParenToken);
                let firstBodyToken = sourceCode.getFirstToken(node);
                let lastBodyToken = sourceCode.getLastToken(node);
                while (util_1.isOpeningParenToken(sourceCode.getTokenBefore(firstBodyToken)) &&
                    util_1.isClosingParenToken(sourceCode.getTokenAfter(lastBodyToken))) {
                    firstBodyToken = sourceCode.getTokenBefore(firstBodyToken);
                    lastBodyToken = sourceCode.getTokenAfter(lastBodyToken);
                }
                offsets.setDesiredOffsets([firstBodyToken.range[0], lastBodyToken.range[1]], lastParentToken, 1);
                /*
                 * For blockless nodes with semicolon-first style, don't indent the semicolon.
                 * e.g.
                 * if (foo) bar()
                 * ; [1, 2, 3].map(foo)
                 */
                const lastToken = sourceCode.getLastToken(node);
                if (lastToken &&
                    node.type !== experimental_utils_1.AST_NODE_TYPES.EmptyStatement &&
                    util_1.isSemicolonToken(lastToken)) {
                    offsets.setDesiredOffset(lastToken, lastParentToken, 0);
                }
            }
        }
        /**
         * Checks the indentation for nodes that are like function calls
         */
        function addFunctionCallIndent(node) {
            const openingParen = node.arguments.length
                ? sourceCode.getFirstTokenBetween(node.callee, node.arguments[0], util_1.isOpeningParenToken)
                : sourceCode.getLastToken(node, 1);
            const closingParen = sourceCode.getLastToken(node);
            parameterParens.add(openingParen);
            parameterParens.add(closingParen);
            offsets.setDesiredOffset(openingParen, sourceCode.getTokenBefore(openingParen), 0);
            addElementListIndent(node.arguments, openingParen, closingParen, options.CallExpression.arguments);
        }
        /**
         * Checks the indentation of parenthesized values, given a list of tokens in a program
         * @param tokens A list of tokens
         */
        function addParensIndent(tokens) {
            const parenStack = [];
            const parenPairs = [];
            tokens.forEach(nextToken => {
                // Accumulate a list of parenthesis pairs
                if (util_1.isOpeningParenToken(nextToken)) {
                    parenStack.push(nextToken);
                }
                else if (util_1.isClosingParenToken(nextToken)) {
                    parenPairs.unshift({ left: parenStack.pop(), right: nextToken });
                }
            });
            parenPairs.forEach(pair => {
                const leftParen = pair.left;
                const rightParen = pair.right;
                // We only want to handle parens around expressions, so exclude parentheses that are in function parameters and function call arguments.
                if (!parameterParens.has(leftParen) &&
                    !parameterParens.has(rightParen)) {
                    const parenthesizedTokens = new Set(sourceCode.getTokensBetween(leftParen, rightParen));
                    parenthesizedTokens.forEach(token => {
                        if (!parenthesizedTokens.has(offsets.getFirstDependency(token))) {
                            offsets.setDesiredOffset(token, leftParen, 1);
                        }
                    });
                }
                offsets.setDesiredOffset(rightParen, leftParen, 0);
            });
        }
        /**
         * Ignore all tokens within an unknown node whose offset do not depend
         * on another token's offset within the unknown node
         */
        function ignoreNode(node) {
            const unknownNodeTokens = new Set(sourceCode.getTokens(node, { includeComments: true }));
            unknownNodeTokens.forEach(token => {
                if (!unknownNodeTokens.has(offsets.getFirstDependency(token))) {
                    const firstTokenOfLine = tokenInfo.getFirstTokenOfLine(token);
                    if (token === firstTokenOfLine) {
                        offsets.ignoreToken(token);
                    }
                    else {
                        offsets.setDesiredOffset(token, firstTokenOfLine, 0);
                    }
                }
            });
        }
        /**
         * Check whether the given token is on the first line of a statement.
         * @param leafNode The expression node that the token belongs directly.
         * @returns `true` if the token is on the first line of a statement.
         */
        function isOnFirstLineOfStatement(token, leafNode) {
            let node = leafNode;
            while (node.parent &&
                !node.parent.type.endsWith('Statement') &&
                !node.parent.type.endsWith('Declaration')) {
                node = node.parent;
            }
            node = node.parent;
            return !node || node.loc.start.line === token.loc.start.line;
        }
        /**
         * Check whether there are any blank (whitespace-only) lines between
         * two tokens on separate lines.
         * @returns `true` if the tokens are on separate lines and
         *   there exists a blank line between them, `false` otherwise.
         */
        function hasBlankLinesBetween(firstToken, secondToken) {
            const firstTokenLine = firstToken.loc.end.line;
            const secondTokenLine = secondToken.loc.start.line;
            if (firstTokenLine === secondTokenLine ||
                firstTokenLine === secondTokenLine - 1) {
                return false;
            }
            for (let line = firstTokenLine + 1; line < secondTokenLine; ++line) {
                if (!tokenInfo.firstTokensByLineNumber.has(line)) {
                    return true;
                }
            }
            return false;
        }
        const ignoredNodeFirstTokens = new Set();
        const baseOffsetListeners = {
            'ArrayExpression, ArrayPattern'(node) {
                var _a;
                const openingBracket = sourceCode.getFirstToken(node);
                const closingBracket = sourceCode.getTokenAfter((_a = node.elements[node.elements.length - 1]) !== null && _a !== void 0 ? _a : openingBracket, util_1.isClosingBracketToken);
                addElementListIndent(node.elements, openingBracket, closingBracket, options.ArrayExpression);
            },
            ArrowFunctionExpression(node) {
                const firstToken = sourceCode.getFirstToken(node);
                if (util_1.isOpeningParenToken(firstToken)) {
                    const openingParen = firstToken;
                    const closingParen = sourceCode.getTokenBefore(node.body, util_1.isClosingParenToken);
                    parameterParens.add(openingParen);
                    parameterParens.add(closingParen);
                    addElementListIndent(node.params, openingParen, closingParen, options.FunctionExpression.parameters);
                }
                addBlocklessNodeIndent(node.body);
            },
            AssignmentExpression(node) {
                const operator = sourceCode.getFirstTokenBetween(node.left, node.right, token => token.value === node.operator);
                offsets.setDesiredOffsets([operator.range[0], node.range[1]], sourceCode.getLastToken(node.left), 1);
                offsets.ignoreToken(operator);
                offsets.ignoreToken(sourceCode.getTokenAfter(operator));
            },
            'BinaryExpression, LogicalExpression'(node) {
                const operator = sourceCode.getFirstTokenBetween(node.left, node.right, token => token.value === node.operator);
                /*
                 * For backwards compatibility, don't check BinaryExpression indents, e.g.
                 * var foo = bar &&
                 *                   baz;
                 */
                const tokenAfterOperator = sourceCode.getTokenAfter(operator);
                offsets.ignoreToken(operator);
                offsets.ignoreToken(tokenAfterOperator);
                offsets.setDesiredOffset(tokenAfterOperator, operator, 0);
            },
            'BlockStatement, ClassBody'(node) {
                let blockIndentLevel;
                if (node.parent && isOuterIIFE(node.parent)) {
                    blockIndentLevel = options.outerIIFEBody;
                }
                else if (node.parent &&
                    (node.parent.type === experimental_utils_1.AST_NODE_TYPES.FunctionExpression ||
                        node.parent.type === experimental_utils_1.AST_NODE_TYPES.ArrowFunctionExpression)) {
                    blockIndentLevel = options.FunctionExpression.body;
                }
                else if (node.parent &&
                    node.parent.type === experimental_utils_1.AST_NODE_TYPES.FunctionDeclaration) {
                    blockIndentLevel = options.FunctionDeclaration.body;
                }
                else {
                    blockIndentLevel = 1;
                }
                /*
                 * For blocks that aren't lone statements, ensure that the opening curly brace
                 * is aligned with the parent.
                 */
                if (node.parent && !STATEMENT_LIST_PARENTS.has(node.parent.type)) {
                    offsets.setDesiredOffset(sourceCode.getFirstToken(node), sourceCode.getFirstToken(node.parent), 0);
                }
                addElementListIndent(node.body, sourceCode.getFirstToken(node), sourceCode.getLastToken(node), blockIndentLevel);
            },
            CallExpression: addFunctionCallIndent,
            'ClassDeclaration[superClass], ClassExpression[superClass]'(node) {
                const classToken = sourceCode.getFirstToken(node);
                const extendsToken = sourceCode.getTokenBefore(node.superClass, util_1.isNotOpeningParenToken);
                offsets.setDesiredOffsets([extendsToken.range[0], node.body.range[0]], classToken, 1);
            },
            ConditionalExpression(node) {
                const firstToken = sourceCode.getFirstToken(node);
                // `flatTernaryExpressions` option is for the following style:
                // var a =
                //     foo > 0 ? bar :
                //     foo < 0 ? baz :
                //     /*else*/ qiz ;
                if (!options.flatTernaryExpressions ||
                    node.test.loc.end.line !== node.consequent.loc.start.line ||
                    isOnFirstLineOfStatement(firstToken, node)) {
                    const questionMarkToken = sourceCode.getFirstTokenBetween(node.test, node.consequent, token => token.type === experimental_utils_1.AST_TOKEN_TYPES.Punctuator && token.value === '?');
                    const colonToken = sourceCode.getFirstTokenBetween(node.consequent, node.alternate, token => token.type === experimental_utils_1.AST_TOKEN_TYPES.Punctuator && token.value === ':');
                    const firstConsequentToken = sourceCode.getTokenAfter(questionMarkToken);
                    const lastConsequentToken = sourceCode.getTokenBefore(colonToken);
                    const firstAlternateToken = sourceCode.getTokenAfter(colonToken);
                    offsets.setDesiredOffset(questionMarkToken, firstToken, 1);
                    offsets.setDesiredOffset(colonToken, firstToken, 1);
                    offsets.setDesiredOffset(firstConsequentToken, firstToken, 1);
                    /*
                     * The alternate and the consequent should usually have the same indentation.
                     * If they share part of a line, align the alternate against the first token of the consequent.
                     * This allows the alternate to be indented correctly in cases like this:
                     * foo ? (
                     *   bar
                     * ) : ( // this '(' is aligned with the '(' above, so it's considered to be aligned with `foo`
                     *   baz // as a result, `baz` is offset by 1 rather than 2
                     * )
                     */
                    if (lastConsequentToken.loc.end.line ===
                        firstAlternateToken.loc.start.line) {
                        offsets.setDesiredOffset(firstAlternateToken, firstConsequentToken, 0);
                    }
                    else {
                        /**
                         * If the alternate and consequent do not share part of a line, offset the alternate from the first
                         * token of the conditional expression. For example:
                         * foo ? bar
                         *   : baz
                         *
                         * If `baz` were aligned with `bar` rather than being offset by 1 from `foo`, `baz` would end up
                         * having no expected indentation.
                         */
                        offsets.setDesiredOffset(firstAlternateToken, firstToken, 1);
                    }
                }
            },
            'DoWhileStatement, WhileStatement, ForInStatement, ForOfStatement': (node) => {
                addBlocklessNodeIndent(node.body);
            },
            ExportNamedDeclaration(node) {
                if (node.declaration === null) {
                    const closingCurly = sourceCode.getLastToken(node, util_1.isClosingBraceToken);
                    // Indent the specifiers in `export {foo, bar, baz}`
                    addElementListIndent(node.specifiers, sourceCode.getFirstToken(node, { skip: 1 }), closingCurly, 1);
                    if (node.source) {
                        // Indent everything after and including the `from` token in `export {foo, bar, baz} from 'qux'`
                        offsets.setDesiredOffsets([closingCurly.range[1], node.range[1]], sourceCode.getFirstToken(node), 1);
                    }
                }
            },
            ForStatement(node) {
                const forOpeningParen = sourceCode.getFirstToken(node, 1);
                if (node.init) {
                    offsets.setDesiredOffsets(node.init.range, forOpeningParen, 1);
                }
                if (node.test) {
                    offsets.setDesiredOffsets(node.test.range, forOpeningParen, 1);
                }
                if (node.update) {
                    offsets.setDesiredOffsets(node.update.range, forOpeningParen, 1);
                }
                addBlocklessNodeIndent(node.body);
            },
            'FunctionDeclaration, FunctionExpression'(node) {
                const closingParen = sourceCode.getTokenBefore(node.body);
                const openingParen = sourceCode.getTokenBefore(node.params.length ? node.params[0] : closingParen);
                parameterParens.add(openingParen);
                parameterParens.add(closingParen);
                addElementListIndent(node.params, openingParen, closingParen, options[node.type].parameters);
            },
            IfStatement(node) {
                addBlocklessNodeIndent(node.consequent);
                if (node.alternate &&
                    node.alternate.type !== experimental_utils_1.AST_NODE_TYPES.IfStatement) {
                    addBlocklessNodeIndent(node.alternate);
                }
            },
            ImportDeclaration(node) {
                if (node.specifiers.some(specifier => specifier.type === experimental_utils_1.AST_NODE_TYPES.ImportSpecifier)) {
                    const openingCurly = sourceCode.getFirstToken(node, util_1.isOpeningBraceToken);
                    const closingCurly = sourceCode.getLastToken(node, util_1.isClosingBraceToken);
                    addElementListIndent(node.specifiers.filter(specifier => specifier.type === experimental_utils_1.AST_NODE_TYPES.ImportSpecifier), openingCurly, closingCurly, options.ImportDeclaration);
                }
                const fromToken = sourceCode.getLastToken(node, token => token.type === experimental_utils_1.AST_TOKEN_TYPES.Identifier && token.value === 'from');
                const sourceToken = sourceCode.getLastToken(node, token => token.type === experimental_utils_1.AST_TOKEN_TYPES.String);
                const semiToken = sourceCode.getLastToken(node, token => token.type === experimental_utils_1.AST_TOKEN_TYPES.Punctuator && token.value === ';');
                if (fromToken) {
                    const end = semiToken && semiToken.range[1] === sourceToken.range[1]
                        ? node.range[1]
                        : sourceToken.range[1];
                    offsets.setDesiredOffsets([fromToken.range[0], end], sourceCode.getFirstToken(node), 1);
                }
            },
            'MemberExpression, JSXMemberExpression, MetaProperty'(node) {
                const object = node.type === experimental_utils_1.AST_NODE_TYPES.MetaProperty ? node.meta : node.object;
                const isComputed = 'computed' in node && node.computed;
                const firstNonObjectToken = sourceCode.getFirstTokenBetween(object, node.property, util_1.isNotClosingParenToken);
                const secondNonObjectToken = sourceCode.getTokenAfter(firstNonObjectToken);
                const objectParenCount = sourceCode.getTokensBetween(object, node.property, { filter: util_1.isClosingParenToken }).length;
                const firstObjectToken = objectParenCount
                    ? sourceCode.getTokenBefore(object, { skip: objectParenCount - 1 })
                    : sourceCode.getFirstToken(object);
                const lastObjectToken = sourceCode.getTokenBefore(firstNonObjectToken);
                const firstPropertyToken = isComputed
                    ? firstNonObjectToken
                    : secondNonObjectToken;
                if (isComputed) {
                    // For computed MemberExpressions, match the closing bracket with the opening bracket.
                    offsets.setDesiredOffset(sourceCode.getLastToken(node), firstNonObjectToken, 0);
                    offsets.setDesiredOffsets(node.property.range, firstNonObjectToken, 1);
                }
                /*
                 * If the object ends on the same line that the property starts, match against the last token
                 * of the object, to ensure that the MemberExpression is not indented.
                 *
                 * Otherwise, match against the first token of the object, e.g.
                 * foo
                 *   .bar
                 *   .baz // <-- offset by 1 from `foo`
                 */
                const offsetBase = lastObjectToken.loc.end.line === firstPropertyToken.loc.start.line
                    ? lastObjectToken
                    : firstObjectToken;
                if (typeof options.MemberExpression === 'number') {
                    // Match the dot (for non-computed properties) or the opening bracket (for computed properties) against the object.
                    offsets.setDesiredOffset(firstNonObjectToken, offsetBase, options.MemberExpression);
                    /*
                     * For computed MemberExpressions, match the first token of the property against the opening bracket.
                     * Otherwise, match the first token of the property against the object.
                     */
                    offsets.setDesiredOffset(secondNonObjectToken, isComputed ? firstNonObjectToken : offsetBase, options.MemberExpression);
                }
                else {
                    // If the MemberExpression option is off, ignore the dot and the first token of the property.
                    offsets.ignoreToken(firstNonObjectToken);
                    offsets.ignoreToken(secondNonObjectToken);
                    // To ignore the property indentation, ensure that the property tokens depend on the ignored tokens.
                    offsets.setDesiredOffset(firstNonObjectToken, offsetBase, 0);
                    offsets.setDesiredOffset(secondNonObjectToken, firstNonObjectToken, 0);
                }
            },
            NewExpression(node) {
                // Only indent the arguments if the NewExpression has parens (e.g. `new Foo(bar)` or `new Foo()`, but not `new Foo`
                if (node.arguments.length > 0 ||
                    (util_1.isClosingParenToken(sourceCode.getLastToken(node)) &&
                        util_1.isOpeningParenToken(sourceCode.getLastToken(node, 1)))) {
                    addFunctionCallIndent(node);
                }
            },
            'ObjectExpression, ObjectPattern'(node) {
                const openingCurly = sourceCode.getFirstToken(node);
                const closingCurly = sourceCode.getTokenAfter(node.properties.length
                    ? node.properties[node.properties.length - 1]
                    : openingCurly, util_1.isClosingBraceToken);
                addElementListIndent(node.properties, openingCurly, closingCurly, options.ObjectExpression);
            },
            Property(node) {
                if (!node.shorthand && !node.method && node.kind === 'init') {
                    const colon = sourceCode.getFirstTokenBetween(node.key, node.value, util_1.isColonToken);
                    offsets.ignoreToken(sourceCode.getTokenAfter(colon));
                }
            },
            SwitchStatement(node) {
                const openingCurly = sourceCode.getTokenAfter(node.discriminant, util_1.isOpeningBraceToken);
                const closingCurly = sourceCode.getLastToken(node);
                offsets.setDesiredOffsets([openingCurly.range[1], closingCurly.range[0]], openingCurly, options.SwitchCase);
                if (node.cases.length) {
                    sourceCode
                        .getTokensBetween(node.cases[node.cases.length - 1], closingCurly, {
                        includeComments: true,
                        filter: util_1.isCommentToken,
                    })
                        .forEach(token => offsets.ignoreToken(token));
                }
            },
            SwitchCase(node) {
                if (!(node.consequent.length === 1 &&
                    node.consequent[0].type === experimental_utils_1.AST_NODE_TYPES.BlockStatement)) {
                    const caseKeyword = sourceCode.getFirstToken(node);
                    const tokenAfterCurrentCase = sourceCode.getTokenAfter(node);
                    offsets.setDesiredOffsets([caseKeyword.range[1], tokenAfterCurrentCase.range[0]], caseKeyword, 1);
                }
            },
            TemplateLiteral(node) {
                node.expressions.forEach((_, index) => {
                    const previousQuasi = node.quasis[index];
                    const nextQuasi = node.quasis[index + 1];
                    const tokenToAlignFrom = previousQuasi.loc.start.line === previousQuasi.loc.end.line
                        ? sourceCode.getFirstToken(previousQuasi)
                        : null;
                    offsets.setDesiredOffsets([previousQuasi.range[1], nextQuasi.range[0]], tokenToAlignFrom, 1);
                    offsets.setDesiredOffset(sourceCode.getFirstToken(nextQuasi), tokenToAlignFrom, 0);
                });
            },
            VariableDeclaration(node) {
                if (node.declarations.length === 0) {
                    return;
                }
                let variableIndent = Object.prototype.hasOwnProperty.call(options.VariableDeclarator, node.kind)
                    ? options.VariableDeclarator[node.kind]
                    : DEFAULT_VARIABLE_INDENT;
                const firstToken = sourceCode.getFirstToken(node);
                const lastToken = sourceCode.getLastToken(node);
                if (variableIndent === 'first') {
                    if (node.declarations.length > 1) {
                        addElementListIndent(node.declarations, firstToken, lastToken, 'first');
                        return;
                    }
                    variableIndent = DEFAULT_VARIABLE_INDENT;
                }
                if (node.declarations[node.declarations.length - 1].loc.start.line >
                    node.loc.start.line) {
                    /*
                     * VariableDeclarator indentation is a bit different from other forms of indentation, in that the
                     * indentation of an opening bracket sometimes won't match that of a closing bracket. For example,
                     * the following indentations are correct:
                     *
                     * var foo = {
                     *   ok: true
                     * };
                     *
                     * var foo = {
                     *     ok: true,
                     *   },
                     *   bar = 1;
                     *
                     * Account for when exiting the AST (after indentations have already been set for the nodes in
                     * the declaration) by manually increasing the indentation level of the tokens in this declarator
                     * on the same line as the start of the declaration, provided that there are declarators that
                     * follow this one.
                     */
                    offsets.setDesiredOffsets(node.range, firstToken, variableIndent, true);
                }
                else {
                    offsets.setDesiredOffsets(node.range, firstToken, variableIndent);
                }
                if (util_1.isSemicolonToken(lastToken)) {
                    offsets.ignoreToken(lastToken);
                }
            },
            VariableDeclarator(node) {
                if (node.init) {
                    const equalOperator = sourceCode.getTokenBefore(node.init, util_1.isNotOpeningParenToken);
                    const tokenAfterOperator = sourceCode.getTokenAfter(equalOperator);
                    offsets.ignoreToken(equalOperator);
                    offsets.ignoreToken(tokenAfterOperator);
                    offsets.setDesiredOffsets([tokenAfterOperator.range[0], node.range[1]], equalOperator, 1);
                    offsets.setDesiredOffset(equalOperator, sourceCode.getLastToken(node.id), 0);
                }
            },
            'JSXAttribute[value]'(node) {
                const nodeValue = node.value;
                const equalsToken = sourceCode.getFirstTokenBetween(node.name, nodeValue, token => token.type === experimental_utils_1.AST_TOKEN_TYPES.Punctuator && token.value === '=');
                offsets.setDesiredOffsets([equalsToken.range[0], nodeValue.range[1]], sourceCode.getFirstToken(node.name), 1);
            },
            JSXElement(node) {
                if (node.closingElement) {
                    addElementListIndent(node.children, sourceCode.getFirstToken(node.openingElement), sourceCode.getFirstToken(node.closingElement), 1);
                }
            },
            JSXOpeningElement(node) {
                const firstToken = sourceCode.getFirstToken(node);
                let closingToken;
                if (node.selfClosing) {
                    closingToken = sourceCode.getLastToken(node, { skip: 1 });
                    offsets.setDesiredOffset(sourceCode.getLastToken(node), closingToken, 0);
                }
                else {
                    closingToken = sourceCode.getLastToken(node);
                }
                offsets.setDesiredOffsets(node.name.range, sourceCode.getFirstToken(node));
                addElementListIndent(node.attributes, firstToken, closingToken, 1);
            },
            JSXClosingElement(node) {
                const firstToken = sourceCode.getFirstToken(node);
                offsets.setDesiredOffsets(node.name.range, firstToken, 1);
            },
            JSXExpressionContainer(node) {
                const openingCurly = sourceCode.getFirstToken(node);
                const closingCurly = sourceCode.getLastToken(node);
                offsets.setDesiredOffsets([openingCurly.range[1], closingCurly.range[0]], openingCurly, 1);
            },
            '*'(node) {
                const firstToken = sourceCode.getFirstToken(node);
                // Ensure that the children of every node are indented at least as much as the first token.
                if (firstToken && !ignoredNodeFirstTokens.has(firstToken)) {
                    offsets.setDesiredOffsets(node.range, firstToken, 0);
                }
            },
        };
        const listenerCallQueue = [];
        /*
         * To ignore the indentation of a node:
         * 1. Don't call the node's listener when entering it (if it has a listener)
         * 2. Don't set any offsets against the first token of the node.
         * 3. Call `ignoreNode` on the node sometime after exiting it and before validating offsets.
         */
        const offsetListeners = Object.keys(baseOffsetListeners).reduce(
        /*
         * Offset listener calls are deferred until traversal is finished, and are called as
         * part of the final `Program:exit` listener. This is necessary because a node might
         * be matched by multiple selectors.
         *
         * Example: Suppose there is an offset listener for `Identifier`, and the user has
         * specified in configuration that `MemberExpression > Identifier` should be ignored.
         * Due to selector specificity rules, the `Identifier` listener will get called first. However,
         * if a given Identifier node is supposed to be ignored, then the `Identifier` offset listener
         * should not have been called at all. Without doing extra selector matching, we don't know
         * whether the Identifier matches the `MemberExpression > Identifier` selector until the
         * `MemberExpression > Identifier` listener is called.
         *
         * To avoid this, the `Identifier` listener isn't called until traversal finishes and all
         * ignored nodes are known.
         */
        (acc, key) => {
            const listener = baseOffsetListeners[key];
            // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
            acc[key] = node => listenerCallQueue.push({ listener, node });
            return acc;
        }, {});
        // For each ignored node selector, set up a listener to collect it into the `ignoredNodes` set.
        const ignoredNodes = new Set();
        /**
         * Ignores a node
         * @param node The node to ignore
         */
        function addToIgnoredNodes(node) {
            ignoredNodes.add(node);
            ignoredNodeFirstTokens.add(sourceCode.getFirstToken(node));
        }
        const ignoredNodeListeners = options.ignoredNodes.reduce((listeners, ignoredSelector) => Object.assign(listeners, { [ignoredSelector]: addToIgnoredNodes }), {});
        /*
         * Join the listeners, and add a listener to verify that all tokens actually have the correct indentation
         * at the end.
         *
         * Using Object.assign will cause some offset listeners to be overwritten if the same selector also appears
         * in `ignoredNodeListeners`. This isn't a problem because all of the matching nodes will be ignored,
         * so those listeners wouldn't be called anyway.
         */
        return Object.assign(offsetListeners, ignoredNodeListeners, {
            '*:exit'(node) {
                // If a node's type is nonstandard, we can't tell how its children should be offset, so ignore it.
                if (!KNOWN_NODES.has(node.type)) {
                    addToIgnoredNodes(node);
                }
            },
            'Program:exit'() {
                // If ignoreComments option is enabled, ignore all comment tokens.
                if (options.ignoreComments) {
                    sourceCode
                        .getAllComments()
                        .forEach(comment => offsets.ignoreToken(comment));
                }
                // Invoke the queued offset listeners for the nodes that aren't ignored.
                listenerCallQueue
                    .filter(nodeInfo => !ignoredNodes.has(nodeInfo.node))
                    .forEach(nodeInfo => nodeInfo.listener(nodeInfo.node));
                // Update the offsets for ignored nodes to prevent their child tokens from being reported.
                ignoredNodes.forEach(ignoreNode);
                addParensIndent(sourceCode.ast.tokens);
                /*
                 * Create a Map from (token) => (precedingToken).
                 * This is necessary because sourceCode.getTokenBefore does not handle a comment as an argument correctly.
                 */
                const precedingTokens = sourceCode.ast.comments.reduce((commentMap, comment) => {
                    var _a;
                    const tokenBefore = sourceCode.getTokenBefore(comment, {
                        includeComments: true,
                    });
                    return commentMap.set(comment, (_a = commentMap.get(tokenBefore)) !== null && _a !== void 0 ? _a : tokenBefore);
                }, new WeakMap());
                sourceCode.lines.forEach((_, lineIndex) => {
                    const lineNumber = lineIndex + 1;
                    if (!tokenInfo.firstTokensByLineNumber.has(lineNumber)) {
                        // Don't check indentation on blank lines
                        return;
                    }
                    const firstTokenOfLine = tokenInfo.firstTokensByLineNumber.get(lineNumber);
                    if (firstTokenOfLine.loc.start.line !== lineNumber) {
                        // Don't check the indentation of multi-line tokens (e.g. template literals or block comments) twice.
                        return;
                    }
                    // If the token matches the expected expected indentation, don't report it.
                    if (validateTokenIndent(firstTokenOfLine, offsets.getDesiredIndent(firstTokenOfLine))) {
                        return;
                    }
                    if (util_1.isCommentToken(firstTokenOfLine)) {
                        const tokenBefore = precedingTokens.get(firstTokenOfLine);
                        const tokenAfter = tokenBefore
                            ? sourceCode.getTokenAfter(tokenBefore)
                            : sourceCode.ast.tokens[0];
                        const mayAlignWithBefore = tokenBefore &&
                            !hasBlankLinesBetween(tokenBefore, firstTokenOfLine);
                        const mayAlignWithAfter = tokenAfter && !hasBlankLinesBetween(firstTokenOfLine, tokenAfter);
                        // If a comment matches the expected indentation of the token immediately before or after, don't report it.
                        if ((mayAlignWithBefore &&
                            validateTokenIndent(firstTokenOfLine, offsets.getDesiredIndent(tokenBefore))) ||
                            (mayAlignWithAfter &&
                                validateTokenIndent(firstTokenOfLine, offsets.getDesiredIndent(tokenAfter)))) {
                            return;
                        }
                    }
                    // Otherwise, report the token/comment.
                    report(firstTokenOfLine, offsets.getDesiredIndent(firstTokenOfLine));
                });
            },
        });
    },
});
//# sourceMappingURL=index.js.map