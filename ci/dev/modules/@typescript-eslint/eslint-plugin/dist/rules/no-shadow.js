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
const scope_manager_1 = require("@typescript-eslint/scope-manager");
const util = __importStar(require("../util"));
exports.default = util.createRule({
    name: 'no-shadow',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow variable declarations from shadowing variables declared in the outer scope',
            category: 'Variables',
            recommended: false,
            extendsBaseRule: true,
        },
        schema: [
            {
                type: 'object',
                properties: {
                    builtinGlobals: {
                        type: 'boolean',
                    },
                    hoist: {
                        enum: ['all', 'functions', 'never'],
                    },
                    allow: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                    },
                    ignoreTypeValueShadow: {
                        type: 'boolean',
                    },
                    ignoreFunctionTypeParameterNameValueShadow: {
                        type: 'boolean',
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            noShadow: "'{{name}}' is already declared in the upper scope.",
        },
    },
    defaultOptions: [
        {
            allow: [],
            builtinGlobals: false,
            hoist: 'functions',
            ignoreTypeValueShadow: true,
            ignoreFunctionTypeParameterNameValueShadow: true,
        },
    ],
    create(context, [options]) {
        /**
         * Check if a scope is a TypeScript module augmenting the global namespace.
         */
        function isGlobalAugmentation(scope) {
            return ((scope.type === scope_manager_1.ScopeType.tsModule && !!scope.block.global) ||
                (!!scope.upper && isGlobalAugmentation(scope.upper)));
        }
        /**
         * Check if variable is a `this` parameter.
         */
        function isThisParam(variable) {
            return variable.defs[0].type === 'Parameter' && variable.name === 'this';
        }
        function isTypeValueShadow(variable, shadowed) {
            if (options.ignoreTypeValueShadow !== true) {
                return false;
            }
            if (!('isValueVariable' in variable)) {
                // this shouldn't happen...
                return false;
            }
            const isShadowedValue = 'isValueVariable' in shadowed ? shadowed.isValueVariable : true;
            return variable.isValueVariable !== isShadowedValue;
        }
        function isFunctionTypeParameterNameValueShadow(variable, shadowed) {
            if (options.ignoreFunctionTypeParameterNameValueShadow !== true) {
                return false;
            }
            if (!('isValueVariable' in variable)) {
                // this shouldn't happen...
                return false;
            }
            const isShadowedValue = 'isValueVariable' in shadowed ? shadowed.isValueVariable : true;
            if (!isShadowedValue) {
                return false;
            }
            const id = variable.identifiers[0];
            return util.isFunctionType(id.parent);
        }
        function isGenericOfStaticMethod(variable) {
            if (!('isTypeVariable' in variable)) {
                // this shouldn't happen...
                return false;
            }
            if (!variable.isTypeVariable) {
                return false;
            }
            if (variable.identifiers.length === 0) {
                return false;
            }
            const typeParameter = variable.identifiers[0].parent;
            if ((typeParameter === null || typeParameter === void 0 ? void 0 : typeParameter.type) !== experimental_utils_1.AST_NODE_TYPES.TSTypeParameter) {
                return false;
            }
            const typeParameterDecl = typeParameter.parent;
            if ((typeParameterDecl === null || typeParameterDecl === void 0 ? void 0 : typeParameterDecl.type) !== experimental_utils_1.AST_NODE_TYPES.TSTypeParameterDeclaration) {
                return false;
            }
            const functionExpr = typeParameterDecl.parent;
            if (!functionExpr ||
                (functionExpr.type !== experimental_utils_1.AST_NODE_TYPES.FunctionExpression &&
                    functionExpr.type !== experimental_utils_1.AST_NODE_TYPES.TSEmptyBodyFunctionExpression)) {
                return false;
            }
            const methodDefinition = functionExpr.parent;
            if ((methodDefinition === null || methodDefinition === void 0 ? void 0 : methodDefinition.type) !== experimental_utils_1.AST_NODE_TYPES.MethodDefinition) {
                return false;
            }
            return methodDefinition.static;
        }
        function isGenericOfClassDecl(variable) {
            if (!('isTypeVariable' in variable)) {
                // this shouldn't happen...
                return false;
            }
            if (!variable.isTypeVariable) {
                return false;
            }
            if (variable.identifiers.length === 0) {
                return false;
            }
            const typeParameter = variable.identifiers[0].parent;
            if ((typeParameter === null || typeParameter === void 0 ? void 0 : typeParameter.type) !== experimental_utils_1.AST_NODE_TYPES.TSTypeParameter) {
                return false;
            }
            const typeParameterDecl = typeParameter.parent;
            if ((typeParameterDecl === null || typeParameterDecl === void 0 ? void 0 : typeParameterDecl.type) !== experimental_utils_1.AST_NODE_TYPES.TSTypeParameterDeclaration) {
                return false;
            }
            const classDecl = typeParameterDecl.parent;
            return (classDecl === null || classDecl === void 0 ? void 0 : classDecl.type) === experimental_utils_1.AST_NODE_TYPES.ClassDeclaration;
        }
        function isGenericOfAStaticMethodShadow(variable, shadowed) {
            return (isGenericOfStaticMethod(variable) && isGenericOfClassDecl(shadowed));
        }
        /**
         * Check if variable name is allowed.
         * @param variable The variable to check.
         * @returns Whether or not the variable name is allowed.
         */
        function isAllowed(variable) {
            return options.allow.indexOf(variable.name) !== -1;
        }
        /**
         * Checks if a variable of the class name in the class scope of ClassDeclaration.
         *
         * ClassDeclaration creates two variables of its name into its outer scope and its class scope.
         * So we should ignore the variable in the class scope.
         * @param variable The variable to check.
         * @returns Whether or not the variable of the class name in the class scope of ClassDeclaration.
         */
        function isDuplicatedClassNameVariable(variable) {
            const block = variable.scope.block;
            return (block.type === experimental_utils_1.AST_NODE_TYPES.ClassDeclaration &&
                block.id === variable.identifiers[0]);
        }
        /**
         * Checks if a variable of the class name in the class scope of TSEnumDeclaration.
         *
         * TSEnumDeclaration creates two variables of its name into its outer scope and its class scope.
         * So we should ignore the variable in the class scope.
         * @param variable The variable to check.
         * @returns Whether or not the variable of the class name in the class scope of TSEnumDeclaration.
         */
        function isDuplicatedEnumNameVariable(variable) {
            const block = variable.scope.block;
            return (block.type === experimental_utils_1.AST_NODE_TYPES.TSEnumDeclaration &&
                block.id === variable.identifiers[0]);
        }
        /**
         * Checks if a variable is inside the initializer of scopeVar.
         *
         * To avoid reporting at declarations such as `var a = function a() {};`.
         * But it should report `var a = function(a) {};` or `var a = function() { function a() {} };`.
         * @param variable The variable to check.
         * @param scopeVar The scope variable to look for.
         * @returns Whether or not the variable is inside initializer of scopeVar.
         */
        function isOnInitializer(variable, scopeVar) {
            var _a;
            const outerScope = scopeVar.scope;
            const outerDef = scopeVar.defs[0];
            const outer = (_a = outerDef === null || outerDef === void 0 ? void 0 : outerDef.parent) === null || _a === void 0 ? void 0 : _a.range;
            const innerScope = variable.scope;
            const innerDef = variable.defs[0];
            const inner = innerDef === null || innerDef === void 0 ? void 0 : innerDef.name.range;
            return !!(outer &&
                inner &&
                outer[0] < inner[0] &&
                inner[1] < outer[1] &&
                ((innerDef.type === 'FunctionName' &&
                    innerDef.node.type === experimental_utils_1.AST_NODE_TYPES.FunctionExpression) ||
                    innerDef.node.type === experimental_utils_1.AST_NODE_TYPES.ClassExpression) &&
                outerScope === innerScope.upper);
        }
        /**
         * Get a range of a variable's identifier node.
         * @param variable The variable to get.
         * @returns The range of the variable's identifier node.
         */
        function getNameRange(variable) {
            const def = variable.defs[0];
            return def === null || def === void 0 ? void 0 : def.name.range;
        }
        /**
         * Checks if a variable is in TDZ of scopeVar.
         * @param variable The variable to check.
         * @param scopeVar The variable of TDZ.
         * @returns Whether or not the variable is in TDZ of scopeVar.
         */
        function isInTdz(variable, scopeVar) {
            const outerDef = scopeVar.defs[0];
            const inner = getNameRange(variable);
            const outer = getNameRange(scopeVar);
            return !!(inner &&
                outer &&
                inner[1] < outer[0] &&
                // Excepts FunctionDeclaration if is {"hoist":"function"}.
                (options.hoist !== 'functions' ||
                    !outerDef ||
                    outerDef.node.type !== experimental_utils_1.AST_NODE_TYPES.FunctionDeclaration));
        }
        /**
         * Finds the variable by a given name in a given scope and its upper scopes.
         * @param initScope A scope to start find.
         * @param name A variable name to find.
         * @returns A found variable or `null`.
         */
        function getVariableByName(initScope, name) {
            let scope = initScope;
            while (scope) {
                const variable = scope.set.get(name);
                if (variable) {
                    return variable;
                }
                scope = scope.upper;
            }
            return null;
        }
        /**
         * Checks the current context for shadowed variables.
         * @param {Scope} scope Fixme
         */
        function checkForShadows(scope) {
            // ignore global augmentation
            if (isGlobalAugmentation(scope)) {
                return;
            }
            const variables = scope.variables;
            for (const variable of variables) {
                // ignore "arguments"
                if (variable.identifiers.length === 0) {
                    continue;
                }
                // this params are pseudo-params that cannot be shadowed
                if (isThisParam(variable)) {
                    continue;
                }
                // ignore variables of a class name in the class scope of ClassDeclaration
                if (isDuplicatedClassNameVariable(variable)) {
                    continue;
                }
                // ignore variables of a class name in the class scope of ClassDeclaration
                if (isDuplicatedEnumNameVariable(variable)) {
                    continue;
                }
                // ignore configured allowed names
                if (isAllowed(variable)) {
                    continue;
                }
                // Gets shadowed variable.
                const shadowed = getVariableByName(scope.upper, variable.name);
                if (!shadowed) {
                    continue;
                }
                // ignore type value variable shadowing if configured
                if (isTypeValueShadow(variable, shadowed)) {
                    continue;
                }
                // ignore function type parameter name shadowing if configured
                if (isFunctionTypeParameterNameValueShadow(variable, shadowed)) {
                    continue;
                }
                // ignore static class method generic shadowing class generic
                // this is impossible for the scope analyser to understand
                // so we have to handle this manually in this rule
                if (isGenericOfAStaticMethodShadow(variable, shadowed)) {
                    continue;
                }
                const isESLintGlobal = 'writeable' in shadowed;
                if ((shadowed.identifiers.length > 0 ||
                    (options.builtinGlobals && isESLintGlobal)) &&
                    !isOnInitializer(variable, shadowed) &&
                    !(options.hoist !== 'all' && isInTdz(variable, shadowed))) {
                    context.report({
                        node: variable.identifiers[0],
                        messageId: 'noShadow',
                        data: {
                            name: variable.name,
                        },
                    });
                }
            }
        }
        return {
            'Program:exit'() {
                const globalScope = context.getScope();
                const stack = globalScope.childScopes.slice();
                while (stack.length) {
                    const scope = stack.pop();
                    stack.push(...scope.childScopes);
                    checkForShadows(scope);
                }
            },
        };
    },
});
//# sourceMappingURL=no-shadow.js.map