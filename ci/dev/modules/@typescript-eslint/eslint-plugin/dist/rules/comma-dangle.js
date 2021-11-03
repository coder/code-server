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
Object.defineProperty(exports, "__esModule", { value: true });
const util = __importStar(require("../util"));
const comma_dangle_1 = __importDefault(require("eslint/lib/rules/comma-dangle"));
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const OPTION_VALUE_SCHEME = [
    'always-multiline',
    'always',
    'never',
    'only-multiline',
];
const DEFAULT_OPTION_VALUE = 'never';
function normalizeOptions(options) {
    var _a, _b, _c;
    if (typeof options === 'string') {
        return {
            enums: options,
            generics: options,
            tuples: options,
        };
    }
    return {
        enums: (_a = options.enums) !== null && _a !== void 0 ? _a : DEFAULT_OPTION_VALUE,
        generics: (_b = options.generics) !== null && _b !== void 0 ? _b : DEFAULT_OPTION_VALUE,
        tuples: (_c = options.tuples) !== null && _c !== void 0 ? _c : DEFAULT_OPTION_VALUE,
    };
}
exports.default = util.createRule({
    name: 'comma-dangle',
    meta: {
        type: 'layout',
        docs: {
            description: 'Require or disallow trailing comma',
            category: 'Stylistic Issues',
            recommended: false,
            extendsBaseRule: true,
        },
        schema: {
            definitions: {
                value: {
                    enum: OPTION_VALUE_SCHEME,
                },
                valueWithIgnore: {
                    enum: [...OPTION_VALUE_SCHEME, 'ignore'],
                },
            },
            type: 'array',
            items: [
                {
                    oneOf: [
                        {
                            $ref: '#/definitions/value',
                        },
                        {
                            type: 'object',
                            properties: {
                                arrays: { $ref: '#/definitions/valueWithIgnore' },
                                objects: { $ref: '#/definitions/valueWithIgnore' },
                                imports: { $ref: '#/definitions/valueWithIgnore' },
                                exports: { $ref: '#/definitions/valueWithIgnore' },
                                functions: { $ref: '#/definitions/valueWithIgnore' },
                                enums: { $ref: '#/definitions/valueWithIgnore' },
                                generics: { $ref: '#/definitions/valueWithIgnore' },
                                tuples: { $ref: '#/definitions/valueWithIgnore' },
                            },
                            additionalProperties: false,
                        },
                    ],
                },
            ],
        },
        fixable: 'code',
        messages: comma_dangle_1.default.meta.messages,
    },
    defaultOptions: ['never'],
    create(context, [options]) {
        const rules = comma_dangle_1.default.create(context);
        const sourceCode = context.getSourceCode();
        const normalizedOptions = normalizeOptions(options);
        const predicate = {
            always: forceComma,
            'always-multiline': forceCommaIfMultiline,
            'only-multiline': allowCommaIfMultiline,
            never: forbidComma,
            ignore: () => { },
        };
        function last(nodes) {
            var _a;
            return (_a = nodes[nodes.length - 1]) !== null && _a !== void 0 ? _a : null;
        }
        function getLastItem(node) {
            switch (node.type) {
                case experimental_utils_1.AST_NODE_TYPES.TSEnumDeclaration:
                    return last(node.members);
                case experimental_utils_1.AST_NODE_TYPES.TSTypeParameterDeclaration:
                    return last(node.params);
                case experimental_utils_1.AST_NODE_TYPES.TSTupleType:
                    return last(node.elementTypes);
                default:
                    return null;
            }
        }
        function getTrailingToken(node) {
            const last = getLastItem(node);
            const trailing = last && sourceCode.getTokenAfter(last);
            return trailing;
        }
        function isMultiline(node) {
            const last = getLastItem(node);
            const lastToken = sourceCode.getLastToken(node);
            return (last === null || last === void 0 ? void 0 : last.loc.end.line) !== (lastToken === null || lastToken === void 0 ? void 0 : lastToken.loc.end.line);
        }
        function forbidComma(node) {
            const last = getLastItem(node);
            const trailing = getTrailingToken(node);
            if (last && trailing && util.isCommaToken(trailing)) {
                context.report({
                    node,
                    messageId: 'unexpected',
                    fix(fixer) {
                        return fixer.remove(trailing);
                    },
                });
            }
        }
        function forceComma(node) {
            const last = getLastItem(node);
            const trailing = getTrailingToken(node);
            if (last && trailing && !util.isCommaToken(trailing)) {
                context.report({
                    node,
                    messageId: 'missing',
                    fix(fixer) {
                        return fixer.insertTextAfter(last, ',');
                    },
                });
            }
        }
        function allowCommaIfMultiline(node) {
            if (!isMultiline(node)) {
                forbidComma(node);
            }
        }
        function forceCommaIfMultiline(node) {
            if (isMultiline(node)) {
                forceComma(node);
            }
            else {
                forbidComma(node);
            }
        }
        return Object.assign(Object.assign({}, rules), { TSEnumDeclaration: predicate[normalizedOptions.enums], TSTypeParameterDeclaration: predicate[normalizedOptions.generics], TSTupleType: predicate[normalizedOptions.tuples] });
    },
});
//# sourceMappingURL=comma-dangle.js.map