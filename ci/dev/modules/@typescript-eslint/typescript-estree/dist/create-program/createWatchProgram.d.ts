import * as ts from 'typescript';
import { Extra } from '../parser-options';
/**
 * Clear all of the parser caches.
 * This should only be used in testing to ensure the parser is clean between tests.
 */
declare function clearWatchCaches(): void;
/**
 * Calculate project environments using options provided by consumer and paths from config
 * @param code The code being linted
 * @param filePathIn The path of the file being parsed
 * @param extra.tsconfigRootDir The root directory for relative tsconfig paths
 * @param extra.projects Provided tsconfig paths
 * @returns The programs corresponding to the supplied tsconfig paths
 */
declare function getProgramsForProjects(code: string, filePathIn: string, extra: Extra): ts.Program[];
declare function createWatchProgram(tsconfigPath: string, extra: Extra): ts.WatchOfConfigFile<ts.BuilderProgram>;
export { clearWatchCaches, createWatchProgram, getProgramsForProjects };
//# sourceMappingURL=createWatchProgram.d.ts.map