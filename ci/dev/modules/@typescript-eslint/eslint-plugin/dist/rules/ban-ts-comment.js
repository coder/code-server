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
exports.defaultMinimumDescriptionLength = void 0;
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const util = __importStar(require("../util"));
exports.defaultMinimumDescriptionLength = 3;
exports.default = util.createRule({
    name: 'ban-ts-comment',
    meta: {
        type: 'problem',
        docs: {
            description: 'Bans `@ts-<directive>` comments from being used or requires descriptions after directive',
            category: 'Best Practices',
            recommended: 'error',
        },
        messages: {
            tsDirectiveComment: 'Do not use "@ts-{{directive}}" because it alters compilation errors.',
            tsDirectiveCommentRequiresDescription: 'Include a description after the "@ts-{{directive}}" directive to explain why the @ts-{{directive}} is necessary. The description must be {{minimumDescriptionLength}} characters or longer.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    'ts-expect-error': {
                        oneOf: [
                            {
                                type: 'boolean',
                                default: true,
                            },
                            {
                                enum: ['allow-with-description'],
                            },
                        ],
                    },
                    'ts-ignore': {
                        oneOf: [
                            {
                                type: 'boolean',
                                default: true,
                            },
                            {
                                enum: ['allow-with-description'],
                            },
                        ],
                    },
                    'ts-nocheck': {
                        oneOf: [
                            {
                                type: 'boolean',
                                default: true,
                            },
                            {
                                enum: ['allow-with-description'],
                            },
                        ],
                    },
                    'ts-check': {
                        oneOf: [
                            {
                                type: 'boolean',
                                default: true,
                            },
                            {
                                enum: ['allow-with-description'],
                            },
                        ],
                    },
                    minimumDescriptionLength: {
                        type: 'number',
                        default: exports.defaultMinimumDescriptionLength,
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    defaultOptions: [
        {
            'ts-expect-error': 'allow-with-description',
            'ts-ignore': true,
            'ts-nocheck': true,
            'ts-check': false,
            minimumDescriptionLength: exports.defaultMinimumDescriptionLength,
        },
    ],
    create(context, [options]) {
        /*
          The regex used are taken from the ones used in the official TypeScript repo -
          https://github.com/microsoft/TypeScript/blob/master/src/compiler/scanner.ts#L281-L289
        */
        const commentDirectiveRegExSingleLine = /^\/*\s*@ts-(expect-error|ignore|check|nocheck)(.*)/;
        const commentDirectiveRegExMultiLine = /^\s*(?:\/|\*)*\s*@ts-(expect-error|ignore|check|nocheck)(.*)/;
        const sourceCode = context.getSourceCode();
        return {
            Program() {
                const comments = sourceCode.getAllComments();
                comments.forEach(comment => {
                    var _a;
                    let regExp = commentDirectiveRegExSingleLine;
                    if (comment.type !== experimental_utils_1.AST_TOKEN_TYPES.Line) {
                        regExp = commentDirectiveRegExMultiLine;
                    }
                    const [, directive, description] = (_a = regExp.exec(comment.value)) !== null && _a !== void 0 ? _a : [];
                    const fullDirective = `ts-${directive}`;
                    const option = options[fullDirective];
                    if (option === true) {
                        context.report({
                            data: { directive },
                            node: comment,
                            messageId: 'tsDirectiveComment',
                        });
                    }
                    if (option === 'allow-with-description') {
                        const { minimumDescriptionLength = exports.defaultMinimumDescriptionLength, } = options;
                        if (description.trim().length < minimumDescriptionLength) {
                            context.report({
                                data: { directive, minimumDescriptionLength },
                                node: comment,
                                messageId: 'tsDirectiveCommentRequiresDescription',
                            });
                        }
                    }
                });
            },
        };
    },
});
//# sourceMappingURL=ban-ts-comment.js.map