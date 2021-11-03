"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const brace_style_1 = __importDefault(require("eslint/lib/rules/brace-style"));
const util_1 = require("../util");
exports.default = util_1.createRule({
    name: 'brace-style',
    meta: {
        type: 'layout',
        docs: {
            description: 'Enforce consistent brace style for blocks',
            category: 'Stylistic Issues',
            recommended: false,
            extendsBaseRule: true,
        },
        messages: brace_style_1.default.meta.messages,
        fixable: brace_style_1.default.meta.fixable,
        schema: brace_style_1.default.meta.schema,
    },
    defaultOptions: ['1tbs'],
    create(context) {
        const [style, { allowSingleLine } = { allowSingleLine: false }] = context.options;
        const isAllmanStyle = style === 'allman';
        const sourceCode = context.getSourceCode();
        const rules = brace_style_1.default.create(context);
        /**
         * Checks a pair of curly brackets based on the user's config
         */
        function validateCurlyPair(openingCurlyToken, closingCurlyToken) {
            if (allowSingleLine &&
                util_1.isTokenOnSameLine(openingCurlyToken, closingCurlyToken)) {
                return;
            }
            const tokenBeforeOpeningCurly = sourceCode.getTokenBefore(openingCurlyToken);
            const tokenBeforeClosingCurly = sourceCode.getTokenBefore(closingCurlyToken);
            const tokenAfterOpeningCurly = sourceCode.getTokenAfter(openingCurlyToken);
            if (!isAllmanStyle &&
                !util_1.isTokenOnSameLine(tokenBeforeOpeningCurly, openingCurlyToken)) {
                context.report({
                    node: openingCurlyToken,
                    messageId: 'nextLineOpen',
                    fix: fixer => {
                        const textRange = [
                            tokenBeforeOpeningCurly.range[1],
                            openingCurlyToken.range[0],
                        ];
                        const textBetween = sourceCode.text.slice(textRange[0], textRange[1]);
                        if (textBetween.trim()) {
                            return null;
                        }
                        return fixer.replaceTextRange(textRange, ' ');
                    },
                });
            }
            if (isAllmanStyle &&
                util_1.isTokenOnSameLine(tokenBeforeOpeningCurly, openingCurlyToken)) {
                context.report({
                    node: openingCurlyToken,
                    messageId: 'sameLineOpen',
                    fix: fixer => fixer.insertTextBefore(openingCurlyToken, '\n'),
                });
            }
            if (util_1.isTokenOnSameLine(openingCurlyToken, tokenAfterOpeningCurly) &&
                tokenAfterOpeningCurly !== closingCurlyToken) {
                context.report({
                    node: openingCurlyToken,
                    messageId: 'blockSameLine',
                    fix: fixer => fixer.insertTextAfter(openingCurlyToken, '\n'),
                });
            }
            if (util_1.isTokenOnSameLine(tokenBeforeClosingCurly, closingCurlyToken) &&
                tokenBeforeClosingCurly !== openingCurlyToken) {
                context.report({
                    node: closingCurlyToken,
                    messageId: 'singleLineClose',
                    fix: fixer => fixer.insertTextBefore(closingCurlyToken, '\n'),
                });
            }
        }
        return Object.assign(Object.assign({}, rules), { 'TSInterfaceBody, TSModuleBlock'(node) {
                const openingCurly = sourceCode.getFirstToken(node);
                const closingCurly = sourceCode.getLastToken(node);
                validateCurlyPair(openingCurly, closingCurly);
            },
            TSEnumDeclaration(node) {
                const closingCurly = sourceCode.getLastToken(node);
                const openingCurly = sourceCode.getTokenBefore(node.members.length ? node.members[0] : closingCurly);
                validateCurlyPair(openingCurly, closingCurly);
            } });
    },
});
//# sourceMappingURL=brace-style.js.map