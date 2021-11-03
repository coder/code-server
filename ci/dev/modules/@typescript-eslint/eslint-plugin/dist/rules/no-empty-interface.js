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
const util = __importStar(require("../util"));
exports.default = util.createRule({
    name: 'no-empty-interface',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow the declaration of empty interfaces',
            category: 'Best Practices',
            recommended: 'error',
            suggestion: true,
        },
        fixable: 'code',
        messages: {
            noEmpty: 'An empty interface is equivalent to `{}`.',
            noEmptyWithSuper: 'An interface declaring no members is equivalent to its supertype.',
        },
        schema: [
            {
                type: 'object',
                additionalProperties: false,
                properties: {
                    allowSingleExtends: {
                        type: 'boolean',
                    },
                },
            },
        ],
    },
    defaultOptions: [
        {
            allowSingleExtends: false,
        },
    ],
    create(context, [{ allowSingleExtends }]) {
        return {
            TSInterfaceDeclaration(node) {
                const sourceCode = context.getSourceCode();
                const filename = context.getFilename();
                if (node.body.body.length !== 0) {
                    // interface contains members --> Nothing to report
                    return;
                }
                const extend = node.extends;
                if (!extend || extend.length === 0) {
                    context.report({
                        node: node.id,
                        messageId: 'noEmpty',
                    });
                }
                else if (extend.length === 1) {
                    // interface extends exactly 1 interface --> Report depending on rule setting
                    if (!allowSingleExtends) {
                        const fix = (fixer) => {
                            let typeParam = '';
                            if (node.typeParameters) {
                                typeParam = sourceCode.getText(node.typeParameters);
                            }
                            return fixer.replaceText(node, `type ${sourceCode.getText(node.id)}${typeParam} = ${sourceCode.getText(extend[0])}`);
                        };
                        // Check if interface is within ambient declaration
                        let useAutoFix = true;
                        if (util.isDefinitionFile(filename)) {
                            const scope = context.getScope();
                            if (scope.type === 'tsModule' && scope.block.declare) {
                                useAutoFix = false;
                            }
                        }
                        context.report(Object.assign({ node: node.id, messageId: 'noEmptyWithSuper' }, (useAutoFix
                            ? { fix }
                            : {
                                suggest: [
                                    {
                                        messageId: 'noEmptyWithSuper',
                                        fix,
                                    },
                                ],
                            })));
                    }
                }
            },
        };
    },
});
//# sourceMappingURL=no-empty-interface.js.map