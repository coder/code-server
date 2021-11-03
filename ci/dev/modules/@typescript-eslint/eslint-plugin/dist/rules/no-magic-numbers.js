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
const no_magic_numbers_1 = __importDefault(require("eslint/lib/rules/no-magic-numbers"));
const util = __importStar(require("../util"));
const baseRuleSchema = Array.isArray(no_magic_numbers_1.default.meta.schema)
    ? no_magic_numbers_1.default.meta.schema[0]
    : no_magic_numbers_1.default.meta.schema;
exports.default = util.createRule({
    name: 'no-magic-numbers',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow magic numbers',
            category: 'Best Practices',
            recommended: false,
            extendsBaseRule: true,
        },
        // Extend base schema with additional property to ignore TS numeric literal types
        schema: [
            Object.assign(Object.assign({}, baseRuleSchema), { properties: Object.assign(Object.assign({}, baseRuleSchema.properties), { ignoreNumericLiteralTypes: {
                        type: 'boolean',
                    }, ignoreEnums: {
                        type: 'boolean',
                    }, ignoreReadonlyClassProperties: {
                        type: 'boolean',
                    } }) }),
        ],
        messages: (_a = no_magic_numbers_1.default.meta.messages) !== null && _a !== void 0 ? _a : {
            useConst: "Number constants declarations must use 'const'.",
            noMagic: 'No magic number: {{raw}}.',
        },
    },
    defaultOptions: [
        {
            ignore: [],
            ignoreArrayIndexes: false,
            enforceConst: false,
            detectObjects: false,
            ignoreNumericLiteralTypes: false,
            ignoreEnums: false,
            ignoreReadonlyClassProperties: false,
        },
    ],
    create(context, [options]) {
        const rules = no_magic_numbers_1.default.create(context);
        return {
            Literal(node) {
                var _a;
                // Check if the node is a TypeScript enum declaration
                if (options.ignoreEnums && isParentTSEnumDeclaration(node)) {
                    return;
                }
                // Check TypeScript specific nodes for Numeric Literal
                if (options.ignoreNumericLiteralTypes &&
                    typeof node.value === 'number' &&
                    isTSNumericLiteralType(node)) {
                    return;
                }
                // Check if the node is a readonly class property
                if (typeof node.value === 'number' &&
                    isParentTSReadonlyClassProperty(node)) {
                    if (options.ignoreReadonlyClassProperties) {
                        return;
                    }
                    let fullNumberNode = node;
                    let raw = node.raw;
                    if (((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type) === experimental_utils_1.AST_NODE_TYPES.UnaryExpression &&
                        // the base rule only shows the operator for negative numbers
                        // https://github.com/eslint/eslint/blob/9dfc8501fb1956c90dc11e6377b4cb38a6bea65d/lib/rules/no-magic-numbers.js#L126
                        node.parent.operator === '-') {
                        fullNumberNode = node.parent;
                        raw = `${node.parent.operator}${node.raw}`;
                    }
                    context.report({
                        messageId: 'noMagic',
                        node: fullNumberNode,
                        data: { raw },
                    });
                    return;
                }
                // Let the base rule deal with the rest
                rules.Literal(node);
            },
        };
    },
});
/**
 * Gets the true parent of the literal, handling prefixed numbers (-1 / +1)
 */
function getLiteralParent(node) {
    var _a;
    if (((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type) === experimental_utils_1.AST_NODE_TYPES.UnaryExpression &&
        ['-', '+'].includes(node.parent.operator)) {
        return node.parent.parent;
    }
    return node.parent;
}
/**
 * Checks if the node grandparent is a Typescript type alias declaration
 * @param node the node to be validated.
 * @returns true if the node grandparent is a Typescript type alias declaration
 * @private
 */
function isGrandparentTSTypeAliasDeclaration(node) {
    var _a, _b;
    return ((_b = (_a = node.parent) === null || _a === void 0 ? void 0 : _a.parent) === null || _b === void 0 ? void 0 : _b.type) === experimental_utils_1.AST_NODE_TYPES.TSTypeAliasDeclaration;
}
/**
 * Checks if the node grandparent is a Typescript union type and its parent is a type alias declaration
 * @param node the node to be validated.
 * @returns true if the node grandparent is a Typescript union type and its parent is a type alias declaration
 * @private
 */
function isGrandparentTSUnionType(node) {
    var _a, _b;
    if (((_b = (_a = node.parent) === null || _a === void 0 ? void 0 : _a.parent) === null || _b === void 0 ? void 0 : _b.type) === experimental_utils_1.AST_NODE_TYPES.TSUnionType) {
        return isGrandparentTSTypeAliasDeclaration(node.parent);
    }
    return false;
}
/**
 * Checks if the node parent is a Typescript enum member
 * @param node the node to be validated.
 * @returns true if the node parent is a Typescript enum member
 * @private
 */
function isParentTSEnumDeclaration(node) {
    const parent = getLiteralParent(node);
    return (parent === null || parent === void 0 ? void 0 : parent.type) === experimental_utils_1.AST_NODE_TYPES.TSEnumMember;
}
/**
 * Checks if the node parent is a Typescript literal type
 * @param node the node to be validated.
 * @returns true if the node parent is a Typescript literal type
 * @private
 */
function isParentTSLiteralType(node) {
    var _a;
    return ((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type) === experimental_utils_1.AST_NODE_TYPES.TSLiteralType;
}
/**
 * Checks if the node is a valid TypeScript numeric literal type.
 * @param node the node to be validated.
 * @returns true if the node is a TypeScript numeric literal type.
 * @private
 */
function isTSNumericLiteralType(node) {
    var _a;
    // For negative numbers, use the parent node
    if (((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type) === experimental_utils_1.AST_NODE_TYPES.UnaryExpression &&
        node.parent.operator === '-') {
        node = node.parent;
    }
    // If the parent node is not a TSLiteralType, early return
    if (!isParentTSLiteralType(node)) {
        return false;
    }
    // If the grandparent is a TSTypeAliasDeclaration, ignore
    if (isGrandparentTSTypeAliasDeclaration(node)) {
        return true;
    }
    // If the grandparent is a TSUnionType and it's parent is a TSTypeAliasDeclaration, ignore
    if (isGrandparentTSUnionType(node)) {
        return true;
    }
    return false;
}
/**
 * Checks if the node parent is a readonly class property
 * @param node the node to be validated.
 * @returns true if the node parent is a readonly class property
 * @private
 */
function isParentTSReadonlyClassProperty(node) {
    const parent = getLiteralParent(node);
    if ((parent === null || parent === void 0 ? void 0 : parent.type) === experimental_utils_1.AST_NODE_TYPES.ClassProperty && parent.readonly) {
        return true;
    }
    return false;
}
//# sourceMappingURL=no-magic-numbers.js.map