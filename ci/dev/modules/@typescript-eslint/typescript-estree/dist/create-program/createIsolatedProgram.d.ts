import { Extra } from '../parser-options';
import { ASTAndProgram } from './shared';
/**
 * @param code The code of the file being linted
 * @returns Returns a new source file and program corresponding to the linted code
 */
declare function createIsolatedProgram(code: string, extra: Extra): ASTAndProgram;
export { createIsolatedProgram };
//# sourceMappingURL=createIsolatedProgram.d.ts.map