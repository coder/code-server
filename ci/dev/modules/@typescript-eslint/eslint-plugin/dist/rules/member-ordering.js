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
exports.defaultOrder = void 0;
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const util = __importStar(require("../util"));
const neverConfig = {
    type: 'string',
    enum: ['never'],
};
const arrayConfig = (memberTypes) => ({
    type: 'array',
    items: {
        enum: memberTypes,
    },
});
const objectConfig = (memberTypes) => ({
    type: 'object',
    properties: {
        memberTypes: {
            oneOf: [arrayConfig(memberTypes), neverConfig],
        },
        order: {
            type: 'string',
            enum: ['alphabetically', 'as-written'],
        },
    },
    additionalProperties: false,
});
exports.defaultOrder = [
    // Index signature
    'signature',
    'call-signature',
    // Fields
    'public-static-field',
    'protected-static-field',
    'private-static-field',
    'public-decorated-field',
    'protected-decorated-field',
    'private-decorated-field',
    'public-instance-field',
    'protected-instance-field',
    'private-instance-field',
    'public-abstract-field',
    'protected-abstract-field',
    'private-abstract-field',
    'public-field',
    'protected-field',
    'private-field',
    'static-field',
    'instance-field',
    'abstract-field',
    'decorated-field',
    'field',
    // Constructors
    'public-constructor',
    'protected-constructor',
    'private-constructor',
    'constructor',
    // Methods
    'public-static-method',
    'protected-static-method',
    'private-static-method',
    'public-decorated-method',
    'protected-decorated-method',
    'private-decorated-method',
    'public-instance-method',
    'protected-instance-method',
    'private-instance-method',
    'public-abstract-method',
    'protected-abstract-method',
    'private-abstract-method',
    'public-method',
    'protected-method',
    'private-method',
    'static-method',
    'instance-method',
    'abstract-method',
    'decorated-method',
    'method',
];
const allMemberTypes = [
    'signature',
    'field',
    'method',
    'call-signature',
    'constructor',
].reduce((all, type) => {
    all.push(type);
    ['public', 'protected', 'private'].forEach(accessibility => {
        if (type !== 'signature') {
            all.push(`${accessibility}-${type}`); // e.g. `public-field`
        }
        // Only class instance fields and methods can have decorators attached to them
        if (type === 'field' || type === 'method') {
            const decoratedMemberType = `${accessibility}-decorated-${type}`;
            const decoratedMemberTypeNoAccessibility = `decorated-${type}`;
            if (!all.includes(decoratedMemberType)) {
                all.push(decoratedMemberType);
            }
            if (!all.includes(decoratedMemberTypeNoAccessibility)) {
                all.push(decoratedMemberTypeNoAccessibility);
            }
        }
        if (type !== 'constructor' && type !== 'signature') {
            // There is no `static-constructor` or `instance-constructor` or `abstract-constructor`
            ['static', 'instance', 'abstract'].forEach(scope => {
                if (!all.includes(`${scope}-${type}`)) {
                    all.push(`${scope}-${type}`);
                }
                all.push(`${accessibility}-${scope}-${type}`);
            });
        }
    });
    return all;
}, []);
const functionExpressions = [
    experimental_utils_1.AST_NODE_TYPES.FunctionExpression,
    experimental_utils_1.AST_NODE_TYPES.ArrowFunctionExpression,
];
/**
 * Gets the node type.
 *
 * @param node the node to be evaluated.
 */
function getNodeType(node) {
    switch (node.type) {
        case experimental_utils_1.AST_NODE_TYPES.TSAbstractMethodDefinition:
        case experimental_utils_1.AST_NODE_TYPES.MethodDefinition:
            return node.kind;
        case experimental_utils_1.AST_NODE_TYPES.TSMethodSignature:
            return 'method';
        case experimental_utils_1.AST_NODE_TYPES.TSCallSignatureDeclaration:
            return 'call-signature';
        case experimental_utils_1.AST_NODE_TYPES.TSConstructSignatureDeclaration:
            return 'constructor';
        case experimental_utils_1.AST_NODE_TYPES.TSAbstractClassProperty:
        case experimental_utils_1.AST_NODE_TYPES.ClassProperty:
            return node.value && functionExpressions.includes(node.value.type)
                ? 'method'
                : 'field';
        case experimental_utils_1.AST_NODE_TYPES.TSPropertySignature:
            return 'field';
        case experimental_utils_1.AST_NODE_TYPES.TSIndexSignature:
            return 'signature';
        default:
            return null;
    }
}
/**
 * Gets the member name based on the member type.
 *
 * @param node the node to be evaluated.
 * @param sourceCode
 */
function getMemberName(node, sourceCode) {
    switch (node.type) {
        case experimental_utils_1.AST_NODE_TYPES.TSPropertySignature:
        case experimental_utils_1.AST_NODE_TYPES.TSMethodSignature:
        case experimental_utils_1.AST_NODE_TYPES.TSAbstractClassProperty:
        case experimental_utils_1.AST_NODE_TYPES.ClassProperty:
            return util.getNameFromMember(node, sourceCode);
        case experimental_utils_1.AST_NODE_TYPES.TSAbstractMethodDefinition:
        case experimental_utils_1.AST_NODE_TYPES.MethodDefinition:
            return node.kind === 'constructor'
                ? 'constructor'
                : util.getNameFromMember(node, sourceCode);
        case experimental_utils_1.AST_NODE_TYPES.TSConstructSignatureDeclaration:
            return 'new';
        case experimental_utils_1.AST_NODE_TYPES.TSCallSignatureDeclaration:
            return 'call';
        case experimental_utils_1.AST_NODE_TYPES.TSIndexSignature:
            return util.getNameFromIndexSignature(node);
        default:
            return null;
    }
}
/**
 * Gets the calculated rank using the provided method definition.
 * The algorithm is as follows:
 * - Get the rank based on the accessibility-scope-type name, e.g. public-instance-field
 * - If there is no order for accessibility-scope-type, then strip out the accessibility.
 * - If there is no order for scope-type, then strip out the scope.
 * - If there is no order for type, then return -1
 * @param memberGroups the valid names to be validated.
 * @param orderConfig the current order to be validated.
 *
 * @return Index of the matching member type in the order configuration.
 */
function getRankOrder(memberGroups, orderConfig) {
    let rank = -1;
    const stack = memberGroups.slice(); // Get a copy of the member groups
    while (stack.length > 0 && rank === -1) {
        rank = orderConfig.indexOf(stack.shift());
    }
    return rank;
}
/**
 * Gets the rank of the node given the order.
 * @param node the node to be evaluated.
 * @param orderConfig the current order to be validated.
 * @param supportsModifiers a flag indicating whether the type supports modifiers (scope or accessibility) or not.
 */
function getRank(node, orderConfig, supportsModifiers) {
    const type = getNodeType(node);
    if (type === null) {
        // shouldn't happen but just in case, put it on the end
        return orderConfig.length - 1;
    }
    const abstract = node.type === experimental_utils_1.AST_NODE_TYPES.TSAbstractClassProperty ||
        node.type === experimental_utils_1.AST_NODE_TYPES.TSAbstractMethodDefinition;
    const scope = 'static' in node && node.static
        ? 'static'
        : abstract
            ? 'abstract'
            : 'instance';
    const accessibility = 'accessibility' in node && node.accessibility
        ? node.accessibility
        : 'public';
    // Collect all existing member groups (e.g. 'public-instance-field', 'instance-field', 'public-field', 'constructor' etc.)
    const memberGroups = [];
    if (supportsModifiers) {
        const decorated = 'decorators' in node && node.decorators.length > 0;
        if (decorated && (type === 'field' || type === 'method')) {
            memberGroups.push(`${accessibility}-decorated-${type}`);
            memberGroups.push(`decorated-${type}`);
        }
        if (type !== 'constructor') {
            // Constructors have no scope
            memberGroups.push(`${accessibility}-${scope}-${type}`);
            memberGroups.push(`${scope}-${type}`);
        }
        memberGroups.push(`${accessibility}-${type}`);
    }
    memberGroups.push(type);
    return getRankOrder(memberGroups, orderConfig);
}
/**
 * Gets the lowest possible rank higher than target.
 * e.g. given the following order:
 *   ...
 *   public-static-method
 *   protected-static-method
 *   private-static-method
 *   public-instance-method
 *   protected-instance-method
 *   private-instance-method
 *   ...
 * and considering that a public-instance-method has already been declared, so ranks contains
 * public-instance-method, then the lowest possible rank for public-static-method is
 * public-instance-method.
 * @param ranks the existing ranks in the object.
 * @param target the target rank.
 * @param order the current order to be validated.
 * @returns the name of the lowest possible rank without dashes (-).
 */
function getLowestRank(ranks, target, order) {
    let lowest = ranks[ranks.length - 1];
    ranks.forEach(rank => {
        if (rank > target) {
            lowest = Math.min(lowest, rank);
        }
    });
    return order[lowest].replace(/-/g, ' ');
}
exports.default = util.createRule({
    name: 'member-ordering',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Require a consistent member declaration order',
            category: 'Stylistic Issues',
            recommended: false,
        },
        messages: {
            incorrectOrder: 'Member "{{member}}" should be declared before member "{{beforeMember}}".',
            incorrectGroupOrder: 'Member {{name}} should be declared before all {{rank}} definitions.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    default: {
                        oneOf: [
                            neverConfig,
                            arrayConfig(allMemberTypes),
                            objectConfig(allMemberTypes),
                        ],
                    },
                    classes: {
                        oneOf: [
                            neverConfig,
                            arrayConfig(allMemberTypes),
                            objectConfig(allMemberTypes),
                        ],
                    },
                    classExpressions: {
                        oneOf: [
                            neverConfig,
                            arrayConfig(allMemberTypes),
                            objectConfig(allMemberTypes),
                        ],
                    },
                    interfaces: {
                        oneOf: [
                            neverConfig,
                            arrayConfig(['signature', 'field', 'method', 'constructor']),
                            objectConfig(['signature', 'field', 'method', 'constructor']),
                        ],
                    },
                    typeLiterals: {
                        oneOf: [
                            neverConfig,
                            arrayConfig(['signature', 'field', 'method', 'constructor']),
                            objectConfig(['signature', 'field', 'method', 'constructor']),
                        ],
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    defaultOptions: [
        {
            default: exports.defaultOrder,
        },
    ],
    create(context, [options]) {
        /**
         * Checks if the member groups are correctly sorted.
         *
         * @param members Members to be validated.
         * @param groupOrder Group order to be validated.
         * @param supportsModifiers A flag indicating whether the type supports modifiers (scope or accessibility) or not.
         *
         * @return Array of member groups or null if one of the groups is not correctly sorted.
         */
        function checkGroupSort(members, groupOrder, supportsModifiers) {
            const previousRanks = [];
            const memberGroups = [];
            let isCorrectlySorted = true;
            // Find first member which isn't correctly sorted
            members.forEach(member => {
                const rank = getRank(member, groupOrder, supportsModifiers);
                const name = getMemberName(member, context.getSourceCode());
                const rankLastMember = previousRanks[previousRanks.length - 1];
                if (rank === -1) {
                    return;
                }
                // Works for 1st item because x < undefined === false for any x (typeof string)
                if (rank < rankLastMember) {
                    context.report({
                        node: member,
                        messageId: 'incorrectGroupOrder',
                        data: {
                            name,
                            rank: getLowestRank(previousRanks, rank, groupOrder),
                        },
                    });
                    isCorrectlySorted = false;
                }
                else if (rank === rankLastMember) {
                    // Same member group --> Push to existing member group array
                    memberGroups[memberGroups.length - 1].push(member);
                }
                else {
                    // New member group --> Create new member group array
                    previousRanks.push(rank);
                    memberGroups.push([member]);
                }
            });
            return isCorrectlySorted ? memberGroups : null;
        }
        /**
         * Checks if the members are alphabetically sorted.
         *
         * @param members Members to be validated.
         *
         * @return True if all members are correctly sorted.
         */
        function checkAlphaSort(members) {
            let previousName = '';
            let isCorrectlySorted = true;
            // Find first member which isn't correctly sorted
            members.forEach(member => {
                const name = getMemberName(member, context.getSourceCode());
                // Note: Not all members have names
                if (name) {
                    if (name < previousName) {
                        context.report({
                            node: member,
                            messageId: 'incorrectOrder',
                            data: {
                                member: name,
                                beforeMember: previousName,
                            },
                        });
                        isCorrectlySorted = false;
                    }
                    previousName = name;
                }
            });
            return isCorrectlySorted;
        }
        /**
         * Validates if all members are correctly sorted.
         *
         * @param members Members to be validated.
         * @param orderConfig Order config to be validated.
         * @param supportsModifiers A flag indicating whether the type supports modifiers (scope or accessibility) or not.
         */
        function validateMembersOrder(members, orderConfig, supportsModifiers) {
            if (orderConfig === 'never') {
                return;
            }
            // Standardize config
            let order = null;
            let memberTypes;
            if (Array.isArray(orderConfig)) {
                memberTypes = orderConfig;
            }
            else {
                order = orderConfig.order;
                memberTypes = orderConfig.memberTypes;
            }
            // Check order
            if (Array.isArray(memberTypes)) {
                const grouped = checkGroupSort(members, memberTypes, supportsModifiers);
                if (grouped === null) {
                    return;
                }
                if (order === 'alphabetically') {
                    grouped.some(groupMember => !checkAlphaSort(groupMember));
                }
            }
            else if (order === 'alphabetically') {
                checkAlphaSort(members);
            }
        }
        return {
            ClassDeclaration(node) {
                var _a;
                validateMembersOrder(node.body.body, (_a = options.classes) !== null && _a !== void 0 ? _a : options.default, true);
            },
            ClassExpression(node) {
                var _a;
                validateMembersOrder(node.body.body, (_a = options.classExpressions) !== null && _a !== void 0 ? _a : options.default, true);
            },
            TSInterfaceDeclaration(node) {
                var _a;
                validateMembersOrder(node.body.body, (_a = options.interfaces) !== null && _a !== void 0 ? _a : options.default, false);
            },
            TSTypeLiteral(node) {
                var _a;
                validateMembersOrder(node.members, (_a = options.typeLiterals) !== null && _a !== void 0 ? _a : options.default, false);
            },
        };
    },
});
//# sourceMappingURL=member-ordering.js.map