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
const keyword_spacing_1 = __importDefault(require("eslint/lib/rules/keyword-spacing"));
const util = __importStar(require("../util"));
exports.default = util.createRule({
    name: 'keyword-spacing',
    meta: {
        type: 'layout',
        docs: {
            description: 'Enforce consistent spacing before and after keywords',
            category: 'Stylistic Issues',
            recommended: false,
            extendsBaseRule: true,
        },
        fixable: 'whitespace',
        schema: keyword_spacing_1.default.meta.schema,
        messages: (_a = keyword_spacing_1.default.meta.messages) !== null && _a !== void 0 ? _a : {
            expectedBefore: 'Expected space(s) before "{{value}}".',
            expectedAfter: 'Expected space(s) after "{{value}}".',
            unexpectedBefore: 'Unexpected space(s) before "{{value}}".',
            unexpectedAfter: 'Unexpected space(s) after "{{value}}".',
        },
    },
    defaultOptions: [{}],
    create(context) {
        const sourceCode = context.getSourceCode();
        const baseRules = keyword_spacing_1.default.create(context);
        return Object.assign(Object.assign({}, baseRules), { TSAsExpression(node) {
                const asToken = util.nullThrows(sourceCode.getTokenAfter(node.expression, token => token.value === 'as'), util.NullThrowsReasons.MissingToken('as', node.type));
                const oldTokenType = asToken.type;
                // as is a contextual keyword, so it's always reported as an Identifier
                // the rule looks for keyword tokens, so we temporarily override it
                // we mutate it at the token level because the rule calls sourceCode.getFirstToken,
                // so mutating a copy would not change the underlying copy returned by that method
                asToken.type = experimental_utils_1.AST_TOKEN_TYPES.Keyword;
                // use this selector just because it is just a call to `checkSpacingAroundFirstToken`
                baseRules.DebuggerStatement(asToken);
                // make sure to reset the type afterward so we don't permanently mutate the AST
                asToken.type = oldTokenType;
            } });
    },
});
//# sourceMappingURL=keyword-spacing.js.map