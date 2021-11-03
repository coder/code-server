import { Extra } from '../parser-options';
import { ASTAndProgram } from './shared';
/**
 * @param code The code of the file being linted
 * @param extra The config object
 * @param extra.tsconfigRootDir The root directory for relative tsconfig paths
 * @param extra.projects Provided tsconfig paths
 * @returns If found, returns the source file corresponding to the code and the containing program
 */
declare function createDefaultProgram(code: string, extra: Extra): ASTAndProgram | undefined;
export { createDefaultProgram };
//# sourceMappingURL=createDefaultProgram.d.ts.map