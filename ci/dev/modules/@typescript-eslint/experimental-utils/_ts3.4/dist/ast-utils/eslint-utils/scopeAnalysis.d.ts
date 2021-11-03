import { TSESTree } from '../../ts-estree';
import * as TSESLint from '../../ts-eslint';
/**
 * Get the variable of a given name.
 *
 * @see {@link https://eslint-utils.mysticatea.dev/api/scope-utils.html#findvariable}
 */
declare const findVariable: (initialScope: TSESLint.Scope.Scope, name: string) => TSESLint.Scope.Variable | null;
/**
 * Get the innermost scope which contains a given node.
 *
 * @see {@link https://eslint-utils.mysticatea.dev/api/scope-utils.html#getinnermostscope}
 * @returns The innermost scope which contains the given node.
 * If such scope doesn't exist then it returns the 1st argument `initialScope`.
 */
declare const getInnermostScope: (initialScope: TSESLint.Scope.Scope, node: TSESTree.Node) => TSESLint.Scope.Scope;
export { findVariable, getInnermostScope };
//# sourceMappingURL=scopeAnalysis.d.ts.map
