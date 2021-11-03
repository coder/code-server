import * as ts from 'typescript';
interface SemanticOrSyntacticError extends ts.Diagnostic {
    message: string;
}
/**
 * By default, diagnostics from the TypeScript compiler contain all errors - regardless of whether
 * they are related to generic ECMAScript standards, or TypeScript-specific constructs.
 *
 * Therefore, we filter out all diagnostics, except for the ones we explicitly want to consider when
 * the user opts in to throwing errors on semantic issues.
 */
export declare function getFirstSemanticOrSyntacticError(program: ts.Program, ast: ts.SourceFile): SemanticOrSyntacticError | undefined;
export {};
//# sourceMappingURL=semantic-or-syntactic-errors.d.ts.map