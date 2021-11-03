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
exports.TYPE_KEYWORDS = void 0;
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const util = __importStar(require("../util"));
function removeSpaces(str) {
    return str.replace(/ /g, '');
}
function stringifyNode(node, sourceCode) {
    return removeSpaces(sourceCode.getText(node));
}
function getCustomMessage(bannedType) {
    if (bannedType === null) {
        return '';
    }
    if (typeof bannedType === 'string') {
        return ` ${bannedType}`;
    }
    if (bannedType.message) {
        return ` ${bannedType.message}`;
    }
    return '';
}
const defaultTypes = {
    String: {
        message: 'Use string instead',
        fixWith: 'string',
    },
    Boolean: {
        message: 'Use boolean instead',
        fixWith: 'boolean',
    },
    Number: {
        message: 'Use number instead',
        fixWith: 'number',
    },
    Symbol: {
        message: 'Use symbol instead',
        fixWith: 'symbol',
    },
    Function: {
        message: [
            'The `Function` type accepts any function-like value.',
            'It provides no type safety when calling the function, which can be a common source of bugs.',
            'It also accepts things like class declarations, which will throw at runtime as they will not be called with `new`.',
            'If you are expecting the function to accept certain arguments, you should explicitly define the function shape.',
        ].join('\n'),
    },
    // object typing
    Object: {
        message: [
            'The `Object` type actually means "any non-nullish value", so it is marginally better than `unknown`.',
            '- If you want a type meaning "any object", you probably want `Record<string, unknown>` instead.',
            '- If you want a type meaning "any value", you probably want `unknown` instead.',
        ].join('\n'),
    },
    '{}': {
        message: [
            '`{}` actually means "any non-nullish value".',
            '- If you want a type meaning "any object", you probably want `Record<string, unknown>` instead.',
            '- If you want a type meaning "any value", you probably want `unknown` instead.',
            '- If you want a type meaning "empty object", you probably want `Record<string, never>` instead.',
        ].join('\n'),
    },
    object: {
        message: [
            'The `object` type is currently hard to use ([see this issue](https://github.com/microsoft/TypeScript/issues/21732)).',
            'Consider using `Record<string, unknown>` instead, as it allows you to more easily inspect and use the keys.',
        ].join('\n'),
    },
};
exports.TYPE_KEYWORDS = {
    bigint: experimental_utils_1.AST_NODE_TYPES.TSBigIntKeyword,
    boolean: experimental_utils_1.AST_NODE_TYPES.TSBooleanKeyword,
    never: experimental_utils_1.AST_NODE_TYPES.TSNeverKeyword,
    null: experimental_utils_1.AST_NODE_TYPES.TSNullKeyword,
    number: experimental_utils_1.AST_NODE_TYPES.TSNumberKeyword,
    object: experimental_utils_1.AST_NODE_TYPES.TSObjectKeyword,
    string: experimental_utils_1.AST_NODE_TYPES.TSStringKeyword,
    symbol: experimental_utils_1.AST_NODE_TYPES.TSSymbolKeyword,
    undefined: experimental_utils_1.AST_NODE_TYPES.TSUndefinedKeyword,
    unknown: experimental_utils_1.AST_NODE_TYPES.TSUnknownKeyword,
    void: experimental_utils_1.AST_NODE_TYPES.TSVoidKeyword,
};
exports.default = util.createRule({
    name: 'ban-types',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Bans specific types from being used',
            category: 'Best Practices',
            recommended: 'error',
        },
        fixable: 'code',
        messages: {
            bannedTypeMessage: "Don't use `{{name}}` as a type.{{customMessage}}",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    types: {
                        type: 'object',
                        additionalProperties: {
                            oneOf: [
                                { type: 'null' },
                                { type: 'boolean' },
                                { type: 'string' },
                                {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        fixWith: { type: 'string' },
                                    },
                                    additionalProperties: false,
                                },
                            ],
                        },
                    },
                    extendDefaults: {
                        type: 'boolean',
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    defaultOptions: [{}],
    create(context, [options]) {
        var _a, _b;
        const extendDefaults = (_a = options.extendDefaults) !== null && _a !== void 0 ? _a : true;
        const customTypes = (_b = options.types) !== null && _b !== void 0 ? _b : {};
        const types = Object.assign({}, extendDefaults ? defaultTypes : {}, customTypes);
        const bannedTypes = new Map(Object.entries(types).map(([type, data]) => [removeSpaces(type), data]));
        function checkBannedTypes(typeNode, name = stringifyNode(typeNode, context.getSourceCode())) {
            const bannedType = bannedTypes.get(name);
            if (bannedType === undefined || bannedType === false) {
                return;
            }
            const customMessage = getCustomMessage(bannedType);
            const fixWith = bannedType && typeof bannedType === 'object' && bannedType.fixWith;
            context.report({
                node: typeNode,
                messageId: 'bannedTypeMessage',
                data: {
                    name,
                    customMessage,
                },
                fix: fixWith
                    ? (fixer) => fixer.replaceText(typeNode, fixWith)
                    : null,
            });
        }
        const keywordSelectors = util.objectReduceKey(exports.TYPE_KEYWORDS, (acc, keyword) => {
            if (bannedTypes.has(keyword)) {
                acc[exports.TYPE_KEYWORDS[keyword]] = (node) => checkBannedTypes(node, keyword);
            }
            return acc;
        }, {});
        return Object.assign(Object.assign({}, keywordSelectors), { TSTypeLiteral(node) {
                if (node.members.length) {
                    return;
                }
                checkBannedTypes(node);
            },
            TSTupleType(node) {
                if (node.elementTypes.length === 0) {
                    checkBannedTypes(node);
                }
            },
            TSTypeReference(node) {
                checkBannedTypes(node.typeName);
                if (node.typeParameters) {
                    checkBannedTypes(node);
                }
            } });
    },
});
//# sourceMappingURL=ban-types.js.map