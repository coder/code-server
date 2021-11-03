import { Extra } from '../parser-options';
import { ASTAndProgram } from './shared';
/**
 * @param code The code of the file being linted
 * @param createDefaultProgram True if the default program should be created
 * @param extra The config object
 * @returns If found, returns the source file corresponding to the code and the containing program
 */
declare function createProjectProgram(code: string, createDefaultProgram: boolean, extra: Extra): ASTAndProgram | undefined;
export { createProjectProgram };
//# sourceMappingURL=createProjectProgram.d.ts.map