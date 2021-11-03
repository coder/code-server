import * as ts from 'typescript';
import { Program } from 'typescript';
import { Extra } from '../parser-options';
interface ASTAndProgram {
    ast: ts.SourceFile;
    program: ts.Program;
}
/**
 * Compiler options required to avoid critical functionality issues
 */
declare const CORE_COMPILER_OPTIONS: ts.CompilerOptions;
declare function createDefaultCompilerOptionsFromExtra(extra: Extra): ts.CompilerOptions;
declare type CanonicalPath = string & {
    __brand: unknown;
};
declare function getCanonicalFileName(filePath: string): CanonicalPath;
declare function ensureAbsolutePath(p: string, extra: Extra): string;
declare function canonicalDirname(p: CanonicalPath): CanonicalPath;
declare function getScriptKind(extra: Extra, filePath?: string): ts.ScriptKind;
declare function getAstFromProgram(currentProgram: Program, extra: Extra): ASTAndProgram | undefined;
export { ASTAndProgram, CORE_COMPILER_OPTIONS, canonicalDirname, CanonicalPath, createDefaultCompilerOptionsFromExtra, ensureAbsolutePath, getCanonicalFileName, getScriptKind, getAstFromProgram, };
//# sourceMappingURL=shared.d.ts.map