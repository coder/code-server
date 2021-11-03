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
const ts = __importStar(require("typescript"));
const util = __importStar(require("../util"));
exports.default = util.createRule({
    name: 'restrict-template-expressions',
    meta: {
        type: 'problem',
        docs: {
            description: 'Enforce template literal expressions to be of string type',
            category: 'Best Practices',
            recommended: 'error',
            requiresTypeChecking: true,
        },
        messages: {
            invalidType: 'Invalid type "{{type}}" of template literal expression.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    allowNumber: { type: 'boolean' },
                    allowBoolean: { type: 'boolean' },
                    allowAny: { type: 'boolean' },
                    allowNullish: { type: 'boolean' },
                },
            },
        ],
    },
    defaultOptions: [
        {
            allowNumber: true,
        },
    ],
    create(context, [options]) {
        const service = util.getParserServices(context);
        const typeChecker = service.program.getTypeChecker();
        function isUnderlyingTypePrimitive(type) {
            if (util.isTypeFlagSet(type, ts.TypeFlags.StringLike)) {
                return true;
            }
            if (options.allowNumber &&
                util.isTypeFlagSet(type, ts.TypeFlags.NumberLike | ts.TypeFlags.BigIntLike)) {
                return true;
            }
            if (options.allowBoolean &&
                util.isTypeFlagSet(type, ts.TypeFlags.BooleanLike)) {
                return true;
            }
            if (options.allowAny && util.isTypeAnyType(type)) {
                return true;
            }
            if (options.allowNullish &&
                util.isTypeFlagSet(type, ts.TypeFlags.Null | ts.TypeFlags.Undefined)) {
                return true;
            }
            return false;
        }
        return {
            TemplateLiteral(node) {
                // don't check tagged template literals
                if (node.parent.type === experimental_utils_1.AST_NODE_TYPES.TaggedTemplateExpression) {
                    return;
                }
                for (const expression of node.expressions) {
                    const expressionType = util.getConstrainedTypeAtLocation(typeChecker, service.esTreeNodeToTSNodeMap.get(expression));
                    if (!isInnerUnionOrIntersectionConformingTo(expressionType, isUnderlyingTypePrimitive)) {
                        context.report({
                            node: expression,
                            messageId: 'invalidType',
                            data: { type: typeChecker.typeToString(expressionType) },
                        });
                    }
                }
            },
        };
        function isInnerUnionOrIntersectionConformingTo(type, predicate) {
            return rec(type);
            function rec(innerType) {
                if (innerType.isUnion()) {
                    return innerType.types.every(rec);
                }
                if (innerType.isIntersection()) {
                    return innerType.types.some(rec);
                }
                return predicate(innerType);
            }
        }
    },
});
//# sourceMappingURL=restrict-template-expressions.js.map