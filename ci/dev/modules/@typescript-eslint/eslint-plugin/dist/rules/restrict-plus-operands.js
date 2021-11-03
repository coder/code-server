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
const ts = __importStar(require("typescript"));
const util = __importStar(require("../util"));
exports.default = util.createRule({
    name: 'restrict-plus-operands',
    meta: {
        type: 'problem',
        docs: {
            description: 'When adding two variables, operands must both be of type number or of type string',
            category: 'Best Practices',
            recommended: 'error',
            requiresTypeChecking: true,
        },
        messages: {
            notNumbers: "Operands of '+' operation must either be both strings or both numbers.",
            notStrings: "Operands of '+' operation must either be both strings or both numbers. Consider using a template literal.",
            notBigInts: "Operands of '+' operation must be both bigints.",
        },
        schema: [
            {
                type: 'object',
                additionalProperties: false,
                properties: {
                    checkCompoundAssignments: {
                        type: 'boolean',
                    },
                },
            },
        ],
    },
    defaultOptions: [
        {
            checkCompoundAssignments: false,
        },
    ],
    create(context, [{ checkCompoundAssignments }]) {
        const service = util.getParserServices(context);
        const typeChecker = service.program.getTypeChecker();
        /**
         * Helper function to get base type of node
         */
        function getBaseTypeOfLiteralType(type) {
            if (type.isNumberLiteral()) {
                return 'number';
            }
            if (type.isStringLiteral() ||
                util.isTypeFlagSet(type, ts.TypeFlags.TemplateLiteral)) {
                return 'string';
            }
            // is BigIntLiteral
            if (type.flags & ts.TypeFlags.BigIntLiteral) {
                return 'bigint';
            }
            if (type.isUnion()) {
                const types = type.types.map(getBaseTypeOfLiteralType);
                return types.every(value => value === types[0]) ? types[0] : 'invalid';
            }
            if (type.isIntersection()) {
                const types = type.types.map(getBaseTypeOfLiteralType);
                return types.some(value => value === 'string') ? 'string' : 'invalid';
            }
            const stringType = typeChecker.typeToString(type);
            if (stringType === 'number' ||
                stringType === 'string' ||
                stringType === 'bigint') {
                return stringType;
            }
            return 'invalid';
        }
        /**
         * Helper function to get base type of node
         * @param node the node to be evaluated.
         */
        function getNodeType(node) {
            const tsNode = service.esTreeNodeToTSNodeMap.get(node);
            const type = util.getConstrainedTypeAtLocation(typeChecker, tsNode);
            return getBaseTypeOfLiteralType(type);
        }
        function checkPlusOperands(node) {
            const leftType = getNodeType(node.left);
            const rightType = getNodeType(node.right);
            if (leftType === 'invalid' ||
                rightType === 'invalid' ||
                leftType !== rightType) {
                if (leftType === 'string' || rightType === 'string') {
                    context.report({
                        node,
                        messageId: 'notStrings',
                    });
                }
                else if (leftType === 'bigint' || rightType === 'bigint') {
                    context.report({
                        node,
                        messageId: 'notBigInts',
                    });
                }
                else {
                    context.report({
                        node,
                        messageId: 'notNumbers',
                    });
                }
            }
        }
        return {
            "BinaryExpression[operator='+']": checkPlusOperands,
            "AssignmentExpression[operator='+=']"(node) {
                if (checkCompoundAssignments) {
                    checkPlusOperands(node);
                }
            },
        };
    },
});
//# sourceMappingURL=restrict-plus-operands.js.map