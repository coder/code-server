"use strict";
/* eslint-disable no-fallthrough */
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
exports.DEFAULT_IGNORED_REGEX_STRING = void 0;
const ts = __importStar(require("typescript"));
const util = __importStar(require("../util"));
exports.DEFAULT_IGNORED_REGEX_STRING = '^_';
exports.default = util.createRule({
    name: 'no-unused-vars-experimental',
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow unused variables and arguments',
            category: 'Best Practices',
            recommended: false,
        },
        deprecated: true,
        replacedBy: ['no-unused-vars'],
        schema: [
            {
                type: 'object',
                properties: {
                    ignoredNamesRegex: {
                        oneOf: [
                            {
                                type: 'string',
                            },
                            {
                                type: 'boolean',
                                enum: [false],
                            },
                        ],
                    },
                    ignoreArgsIfArgsAfterAreUsed: {
                        type: 'boolean',
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unused: "{{type}} '{{name}}' is declared but its value is never read.",
            unusedWithIgnorePattern: "{{type}} '{{name}}' is declared but its value is never read. Allowed unused names must match {{pattern}}.",
            unusedImport: 'All imports in import declaration are unused.',
            unusedTypeParameters: 'All type parameters are unused.',
        },
    },
    defaultOptions: [
        {
            ignoredNamesRegex: exports.DEFAULT_IGNORED_REGEX_STRING,
            ignoreArgsIfArgsAfterAreUsed: false,
        },
    ],
    create(context, [userOptions]) {
        var _a;
        const parserServices = util.getParserServices(context, true);
        const tsProgram = parserServices.program;
        const afterAllDiagnosticsCallbacks = [];
        const options = {
            ignoredNames: userOptions && typeof userOptions.ignoredNamesRegex === 'string'
                ? new RegExp(userOptions.ignoredNamesRegex)
                : null,
            ignoreArgsIfArgsAfterAreUsed: (_a = userOptions.ignoreArgsIfArgsAfterAreUsed) !== null && _a !== void 0 ? _a : false,
        };
        function handleIdentifier(identifier) {
            function report(type) {
                const node = parserServices.tsNodeToESTreeNodeMap.get(identifier);
                const regex = options.ignoredNames;
                const name = identifier.getText();
                if (regex) {
                    if (!regex.test(name)) {
                        context.report({
                            node,
                            messageId: 'unusedWithIgnorePattern',
                            data: {
                                name,
                                type,
                                pattern: regex.toString(),
                            },
                        });
                    }
                }
                else {
                    context.report({
                        node,
                        messageId: 'unused',
                        data: {
                            name,
                            type,
                        },
                    });
                }
            }
            const parent = identifier.parent;
            // is a single variable diagnostic
            switch (parent.kind) {
                case ts.SyntaxKind.BindingElement:
                case ts.SyntaxKind.ObjectBindingPattern:
                    report('Destructured Variable');
                    break;
                case ts.SyntaxKind.ClassDeclaration:
                    report('Class');
                    break;
                case ts.SyntaxKind.EnumDeclaration:
                    report('Enum');
                    break;
                case ts.SyntaxKind.FunctionDeclaration:
                    report('Function');
                    break;
                // this won't happen because there are specific nodes that wrap up named/default import identifiers
                // case ts.SyntaxKind.ImportDeclaration:
                // import equals is always treated as a variable
                case ts.SyntaxKind.ImportEqualsDeclaration:
                // the default import is NOT used, but a named import is used
                case ts.SyntaxKind.ImportClause:
                // a named import is NOT used, but either another named import, or the default import is used
                case ts.SyntaxKind.ImportSpecifier:
                // a namespace import is NOT used, but the default import is used
                case ts.SyntaxKind.NamespaceImport:
                    report('Import');
                    break;
                case ts.SyntaxKind.InterfaceDeclaration:
                    report('Interface');
                    break;
                case ts.SyntaxKind.MethodDeclaration:
                    report('Method');
                    break;
                case ts.SyntaxKind.Parameter:
                    handleParameterDeclaration(identifier, parent);
                    break;
                case ts.SyntaxKind.PropertyDeclaration:
                    // eslint-disable-next-line @typescript-eslint/internal/prefer-ast-types-enum
                    report('Property');
                    break;
                case ts.SyntaxKind.TypeAliasDeclaration:
                    report('Type');
                    break;
                case ts.SyntaxKind.TypeParameter:
                    handleTypeParam(identifier);
                    break;
                case ts.SyntaxKind.VariableDeclaration:
                    report('Variable');
                    break;
                default:
                    throw new Error(`Unknown node with kind ${parent.kind}.`);
                // TODO - should we just handle this gracefully?
                // report('Unknown Node');
                // break;
            }
        }
        const unusedParameters = new Set();
        function handleParameterDeclaration(identifier, parent) {
            const name = identifier.getText();
            // regardless of if the parameter is ignored, track that it had a diagnostic fired on it
            unusedParameters.add(identifier);
            /*
            NOTE - Typescript will automatically ignore parameters that have a
                   leading underscore in their name. We cannot do anything about this.
            */
            function report() {
                const node = parserServices.tsNodeToESTreeNodeMap.get(identifier);
                context.report({
                    node,
                    messageId: 'unused',
                    data: {
                        name,
                        type: 'Parameter',
                    },
                });
            }
            const isLastParameter = parent.parent.parameters.indexOf(parent) ===
                parent.parent.parameters.length - 1;
            if (!isLastParameter && options.ignoreArgsIfArgsAfterAreUsed) {
                // once all diagnostics are processed, we can check if the following args are unused
                afterAllDiagnosticsCallbacks.push(() => {
                    for (const param of parent.parent.parameters) {
                        if (!unusedParameters.has(param.name)) {
                            return;
                        }
                    }
                    // none of the following params were unused, so report
                    report();
                });
            }
            else {
                report();
            }
        }
        function handleImportDeclaration(parent) {
            // the entire import statement is unused
            /*
            NOTE - Typescript will automatically ignore imports that have a
                   leading underscore in their name. We cannot do anything about this.
            */
            context.report({
                messageId: 'unusedImport',
                node: parserServices.tsNodeToESTreeNodeMap.get(parent),
            });
        }
        function handleDestructure(parent) {
            // the entire destructure is unused
            // note that this case only ever triggers for simple, single-level destructured objects
            // i.e. these will not trigger it:
            // - const {a:_a, b, c: {d}} = z;
            // - const [a, b] = c;
            parent.elements.forEach(element => {
                if (element.kind === ts.SyntaxKind.BindingElement) {
                    const name = element.name;
                    if (name.kind === ts.SyntaxKind.Identifier) {
                        handleIdentifier(name);
                    }
                }
            });
        }
        function handleTypeParamList(node) {
            // the entire generic decl list is unused
            /*
            NOTE - Typescript will automatically ignore generics that have a
                   leading underscore in their name. We cannot do anything about this.
            */
            const parent = parserServices.tsNodeToESTreeNodeMap.get(node);
            context.report({
                messageId: 'unusedTypeParameters',
                node: parent.typeParameters,
            });
        }
        function handleTypeParam(identifier) {
            context.report({
                node: parserServices.tsNodeToESTreeNodeMap.get(identifier),
                messageId: 'unused',
                data: {
                    name: identifier.getText(),
                    type: 'Type Parameter',
                },
            });
        }
        return {
            'Program:exit'(program) {
                const tsNode = parserServices.esTreeNodeToTSNodeMap.get(program);
                const sourceFile = util.getSourceFileOfNode(tsNode);
                const diagnostics = tsProgram.getSemanticDiagnostics(sourceFile);
                diagnostics.forEach(diag => {
                    if (isUnusedDiagnostic(diag.code)) {
                        if (diag.start !== undefined) {
                            const node = util.getTokenAtPosition(sourceFile, diag.start);
                            const parent = node.parent;
                            if (isIdentifier(node)) {
                                handleIdentifier(node);
                            }
                            else if (isImport(parent)) {
                                handleImportDeclaration(parent);
                            }
                            else if (isDestructure(parent)) {
                                handleDestructure(parent);
                            }
                            else if (isGeneric(node, parent)) {
                                handleTypeParamList(parent);
                            }
                        }
                    }
                });
                // trigger all the checks to be done after all the diagnostics have been evaluated
                afterAllDiagnosticsCallbacks.forEach(cb => cb());
            },
        };
    },
});
/**
 * Checks if the diagnostic code is one of the expected "unused var" codes
 */
function isUnusedDiagnostic(code) {
    return [
        6133,
        6138,
        6192,
        6196,
        6198,
        6199,
        6205, // All type parameters are unused.
    ].includes(code);
}
/**
 * Checks if the given node is a destructuring pattern
 */
function isDestructure(node) {
    return (node.kind === ts.SyntaxKind.ObjectBindingPattern ||
        node.kind === ts.SyntaxKind.ArrayBindingPattern);
}
function isImport(node) {
    return node.kind === ts.SyntaxKind.ImportDeclaration;
}
function isIdentifier(node) {
    return node.kind === ts.SyntaxKind.Identifier;
}
function isGeneric(node, parent) {
    return (node.kind === ts.SyntaxKind.LessThanToken &&
        parent.typeParameters !== undefined);
}
//# sourceMappingURL=no-unused-vars-experimental.js.map