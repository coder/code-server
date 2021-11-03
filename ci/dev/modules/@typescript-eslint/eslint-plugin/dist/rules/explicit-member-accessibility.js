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
const util = __importStar(require("../util"));
const accessibilityLevel = { enum: ['explicit', 'no-public', 'off'] };
exports.default = util.createRule({
    name: 'explicit-member-accessibility',
    meta: {
        type: 'problem',
        docs: {
            description: 'Require explicit accessibility modifiers on class properties and methods',
            category: 'Stylistic Issues',
            // too opinionated to be recommended
            recommended: false,
        },
        fixable: 'code',
        messages: {
            missingAccessibility: 'Missing accessibility modifier on {{type}} {{name}}.',
            unwantedPublicAccessibility: 'Public accessibility modifier on {{type}} {{name}}.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    accessibility: accessibilityLevel,
                    overrides: {
                        type: 'object',
                        properties: {
                            accessors: accessibilityLevel,
                            constructors: accessibilityLevel,
                            methods: accessibilityLevel,
                            properties: accessibilityLevel,
                            parameterProperties: accessibilityLevel,
                        },
                        additionalProperties: false,
                    },
                    ignoredMethodNames: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    defaultOptions: [{ accessibility: 'explicit' }],
    create(context, [option]) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const sourceCode = context.getSourceCode();
        const baseCheck = (_a = option.accessibility) !== null && _a !== void 0 ? _a : 'explicit';
        const overrides = (_b = option.overrides) !== null && _b !== void 0 ? _b : {};
        const ctorCheck = (_c = overrides.constructors) !== null && _c !== void 0 ? _c : baseCheck;
        const accessorCheck = (_d = overrides.accessors) !== null && _d !== void 0 ? _d : baseCheck;
        const methodCheck = (_e = overrides.methods) !== null && _e !== void 0 ? _e : baseCheck;
        const propCheck = (_f = overrides.properties) !== null && _f !== void 0 ? _f : baseCheck;
        const paramPropCheck = (_g = overrides.parameterProperties) !== null && _g !== void 0 ? _g : baseCheck;
        const ignoredMethodNames = new Set((_h = option.ignoredMethodNames) !== null && _h !== void 0 ? _h : []);
        /**
         * Generates the report for rule violations
         */
        function reportIssue(messageId, nodeType, node, nodeName, fix = null) {
            context.report({
                node: node,
                messageId: messageId,
                data: {
                    type: nodeType,
                    name: nodeName,
                },
                fix: fix,
            });
        }
        /**
         * Checks if a method declaration has an accessibility modifier.
         * @param methodDefinition The node representing a MethodDefinition.
         */
        function checkMethodAccessibilityModifier(methodDefinition) {
            let nodeType = 'method definition';
            let check = baseCheck;
            switch (methodDefinition.kind) {
                case 'method':
                    check = methodCheck;
                    break;
                case 'constructor':
                    check = ctorCheck;
                    break;
                case 'get':
                case 'set':
                    check = accessorCheck;
                    nodeType = `${methodDefinition.kind} property accessor`;
                    break;
            }
            const methodName = util.getNameFromMember(methodDefinition, sourceCode);
            if (check === 'off' || ignoredMethodNames.has(methodName)) {
                return;
            }
            if (check === 'no-public' &&
                methodDefinition.accessibility === 'public') {
                reportIssue('unwantedPublicAccessibility', nodeType, methodDefinition, methodName, getUnwantedPublicAccessibilityFixer(methodDefinition));
            }
            else if (check === 'explicit' && !methodDefinition.accessibility) {
                reportIssue('missingAccessibility', nodeType, methodDefinition, methodName);
            }
        }
        /**
         * Creates a fixer that removes a "public" keyword with following spaces
         */
        function getUnwantedPublicAccessibilityFixer(node) {
            return function (fixer) {
                const tokens = sourceCode.getTokens(node);
                let rangeToRemove;
                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    if (token.type === experimental_utils_1.AST_TOKEN_TYPES.Keyword &&
                        token.value === 'public') {
                        const commensAfterPublicKeyword = sourceCode.getCommentsAfter(token);
                        if (commensAfterPublicKeyword.length) {
                            // public /* Hi there! */ static foo()
                            // ^^^^^^^
                            rangeToRemove = [
                                token.range[0],
                                commensAfterPublicKeyword[0].range[0],
                            ];
                            break;
                        }
                        else {
                            // public static foo()
                            // ^^^^^^^
                            rangeToRemove = [token.range[0], tokens[i + 1].range[0]];
                            break;
                        }
                    }
                }
                return fixer.removeRange(rangeToRemove);
            };
        }
        /**
         * Checks if property has an accessibility modifier.
         * @param classProperty The node representing a ClassProperty.
         */
        function checkPropertyAccessibilityModifier(classProperty) {
            const nodeType = 'class property';
            const propertyName = util.getNameFromMember(classProperty, sourceCode);
            if (propCheck === 'no-public' &&
                classProperty.accessibility === 'public') {
                reportIssue('unwantedPublicAccessibility', nodeType, classProperty, propertyName, getUnwantedPublicAccessibilityFixer(classProperty));
            }
            else if (propCheck === 'explicit' && !classProperty.accessibility) {
                reportIssue('missingAccessibility', nodeType, classProperty, propertyName);
            }
        }
        /**
         * Checks that the parameter property has the desired accessibility modifiers set.
         * @param node The node representing a Parameter Property
         */
        function checkParameterPropertyAccessibilityModifier(node) {
            const nodeType = 'parameter property';
            // HAS to be an identifier or assignment or TSC will throw
            if (node.parameter.type !== experimental_utils_1.AST_NODE_TYPES.Identifier &&
                node.parameter.type !== experimental_utils_1.AST_NODE_TYPES.AssignmentPattern) {
                return;
            }
            const nodeName = node.parameter.type === experimental_utils_1.AST_NODE_TYPES.Identifier
                ? node.parameter.name
                : // has to be an Identifier or TSC will throw an error
                    node.parameter.left.name;
            switch (paramPropCheck) {
                case 'explicit': {
                    if (!node.accessibility) {
                        reportIssue('missingAccessibility', nodeType, node, nodeName);
                    }
                    break;
                }
                case 'no-public': {
                    if (node.accessibility === 'public' && node.readonly) {
                        reportIssue('unwantedPublicAccessibility', nodeType, node, nodeName, getUnwantedPublicAccessibilityFixer(node));
                    }
                    break;
                }
            }
        }
        return {
            TSParameterProperty: checkParameterPropertyAccessibilityModifier,
            ClassProperty: checkPropertyAccessibilityModifier,
            MethodDefinition: checkMethodAccessibilityModifier,
        };
    },
});
//# sourceMappingURL=explicit-member-accessibility.js.map