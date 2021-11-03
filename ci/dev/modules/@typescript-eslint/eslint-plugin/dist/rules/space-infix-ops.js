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
const space_infix_ops_1 = __importDefault(require("eslint/lib/rules/space-infix-ops"));
const util = __importStar(require("../util"));
const UNIONS = ['|', '&'];
exports.default = util.createRule({
    name: 'space-infix-ops',
    meta: {
        type: 'layout',
        docs: {
            description: 'This rule is aimed at ensuring there are spaces around infix operators.',
            category: 'Stylistic Issues',
            recommended: false,
            extendsBaseRule: true,
        },
        fixable: space_infix_ops_1.default.meta.fixable,
        schema: space_infix_ops_1.default.meta.schema,
        messages: (_a = space_infix_ops_1.default.meta.messages) !== null && _a !== void 0 ? _a : {
            missingSpace: "Operator '{{operator}}' must be spaced.",
        },
    },
    defaultOptions: [
        {
            int32Hint: false,
        },
    ],
    create(context) {
        const rules = space_infix_ops_1.default.create(context);
        const sourceCode = context.getSourceCode();
        const report = (node, operator) => {
            context.report({
                node: node,
                loc: operator.loc,
                messageId: 'missingSpace',
                data: {
                    operator: operator.value,
                },
                fix(fixer) {
                    const previousToken = sourceCode.getTokenBefore(operator);
                    const afterToken = sourceCode.getTokenAfter(operator);
                    let fixString = '';
                    if (operator.range[0] - previousToken.range[1] === 0) {
                        fixString = ' ';
                    }
                    fixString += operator.value;
                    if (afterToken.range[0] - operator.range[1] === 0) {
                        fixString += ' ';
                    }
                    return fixer.replaceText(operator, fixString);
                },
            });
        };
        function isSpaceChar(token) {
            return token.type === experimental_utils_1.AST_TOKEN_TYPES.Punctuator && token.value === '=';
        }
        function checkAndReportAssignmentSpace(node, leftNode, rightNode) {
            if (!rightNode) {
                return;
            }
            const operator = sourceCode.getFirstTokenBetween(leftNode, rightNode, isSpaceChar);
            const prev = sourceCode.getTokenBefore(operator);
            const next = sourceCode.getTokenAfter(operator);
            if (!sourceCode.isSpaceBetween(prev, operator) ||
                !sourceCode.isSpaceBetween(operator, next)) {
                report(node, operator);
            }
        }
        /**
         * Check if it has an assignment char and report if it's faulty
         * @param node The node to report
         */
        function checkForEnumAssignmentSpace(node) {
            if (!node.initializer) {
                return;
            }
            const leftNode = sourceCode.getTokenByRangeStart(node.id.range[0]);
            const rightNode = sourceCode.getTokenByRangeStart(node.initializer.range[0]);
            checkAndReportAssignmentSpace(node, leftNode, rightNode);
        }
        /**
         * Check if it has an assignment char and report if it's faulty
         * @param node The node to report
         */
        function checkForClassPropertyAssignmentSpace(node) {
            var _a, _b;
            const leftNode = sourceCode.getTokenByRangeStart((_b = (_a = node.typeAnnotation) === null || _a === void 0 ? void 0 : _a.range[0]) !== null && _b !== void 0 ? _b : node.range[0]);
            const rightNode = node.value
                ? sourceCode.getTokenByRangeStart(node.value.range[0])
                : undefined;
            checkAndReportAssignmentSpace(node, leftNode, rightNode);
        }
        /**
         * Check if it is missing spaces between type annotations chaining
         * @param typeAnnotation TypeAnnotations list
         */
        function checkForTypeAnnotationSpace(typeAnnotation) {
            const types = typeAnnotation.types;
            types.forEach(type => {
                const operator = sourceCode.getTokenBefore(type);
                if (operator != null && UNIONS.includes(operator.value)) {
                    const prev = sourceCode.getTokenBefore(operator);
                    const next = sourceCode.getTokenAfter(operator);
                    if (!sourceCode.isSpaceBetween(prev, operator) ||
                        !sourceCode.isSpaceBetween(operator, next)) {
                        report(typeAnnotation, operator);
                    }
                }
            });
        }
        /**
         * Check if it has an assignment char and report if it's faulty
         * @param node The node to report
         */
        function checkForTypeAliasAssignment(node) {
            const leftNode = sourceCode.getTokenByRangeStart(node.id.range[0]);
            const rightNode = sourceCode.getTokenByRangeStart(node.typeAnnotation.range[0]);
            checkAndReportAssignmentSpace(node, leftNode, rightNode);
        }
        return Object.assign(Object.assign({}, rules), { TSEnumMember: checkForEnumAssignmentSpace, ClassProperty: checkForClassPropertyAssignmentSpace, TSTypeAliasDeclaration: checkForTypeAliasAssignment, TSUnionType: checkForTypeAnnotationSpace, TSIntersectionType: checkForTypeAnnotationSpace });
    },
});
//# sourceMappingURL=space-infix-ops.js.map