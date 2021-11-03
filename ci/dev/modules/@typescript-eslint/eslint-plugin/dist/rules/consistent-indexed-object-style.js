"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
exports.default = util_1.createRule({
    name: 'consistent-indexed-object-style',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Enforce or disallow the use of the record type',
            category: 'Stylistic Issues',
            // too opinionated to be recommended
            recommended: false,
        },
        messages: {
            preferRecord: 'A record is preferred over an index signature',
            preferIndexSignature: 'An index signature is preferred over a record.',
        },
        fixable: 'code',
        schema: [
            {
                enum: ['record', 'index-signature'],
            },
        ],
    },
    defaultOptions: ['record'],
    create(context) {
        const sourceCode = context.getSourceCode();
        if (context.options[0] === 'index-signature') {
            return {
                TSTypeReference(node) {
                    var _a;
                    const typeName = node.typeName;
                    if (typeName.type !== experimental_utils_1.AST_NODE_TYPES.Identifier) {
                        return;
                    }
                    if (typeName.name !== 'Record') {
                        return;
                    }
                    const params = (_a = node.typeParameters) === null || _a === void 0 ? void 0 : _a.params;
                    if ((params === null || params === void 0 ? void 0 : params.length) !== 2) {
                        return;
                    }
                    context.report({
                        node,
                        messageId: 'preferIndexSignature',
                        fix(fixer) {
                            const key = sourceCode.getText(params[0]);
                            const type = sourceCode.getText(params[1]);
                            return fixer.replaceText(node, `{ [key: ${key}]: ${type} }`);
                        },
                    });
                },
            };
        }
        function checkMembers(members, node, prefix, postfix, safeFix = true) {
            if (members.length !== 1) {
                return;
            }
            const [member] = members;
            if (member.type !== experimental_utils_1.AST_NODE_TYPES.TSIndexSignature) {
                return;
            }
            const [parameter] = member.parameters;
            if (!parameter) {
                return;
            }
            if (parameter.type !== experimental_utils_1.AST_NODE_TYPES.Identifier) {
                return;
            }
            const keyType = parameter.typeAnnotation;
            if (!keyType) {
                return;
            }
            const valueType = member.typeAnnotation;
            if (!valueType) {
                return;
            }
            context.report({
                node,
                messageId: 'preferRecord',
                fix: safeFix
                    ? (fixer) => {
                        const key = sourceCode.getText(keyType.typeAnnotation);
                        const value = sourceCode.getText(valueType.typeAnnotation);
                        const record = member.readonly
                            ? `Readonly<Record<${key}, ${value}>>`
                            : `Record<${key}, ${value}>`;
                        return fixer.replaceText(node, `${prefix}${record}${postfix}`);
                    }
                    : null,
            });
        }
        return {
            TSTypeLiteral(node) {
                checkMembers(node.members, node, '', '');
            },
            TSInterfaceDeclaration(node) {
                var _a, _b, _c, _d;
                let genericTypes = '';
                if (((_b = (_a = node.typeParameters) === null || _a === void 0 ? void 0 : _a.params) !== null && _b !== void 0 ? _b : []).length > 0) {
                    genericTypes = `<${(_c = node.typeParameters) === null || _c === void 0 ? void 0 : _c.params.map(p => p.name.name).join(', ')}>`;
                }
                checkMembers(node.body.body, node, `type ${node.id.name}${genericTypes} = `, ';', !((_d = node.extends) === null || _d === void 0 ? void 0 : _d.length));
            },
        };
    },
});
//# sourceMappingURL=consistent-indexed-object-style.js.map