/// <reference types="node" />
import { Context, RunningScriptOptions } from 'vm';
/**
 * Compiles sync JavaScript code into JavaScript with async Functions.
 *
 * @param {String} code JavaScript string to convert
 * @param {Array} names Array of function names to add `await` operators to
 * @return {String} Converted JavaScript string with async/await injected
 * @api public
 */
declare function degenerator(code: string, _names: degenerator.DegeneratorNames): string;
declare namespace degenerator {
    type DegeneratorName = string | RegExp;
    type DegeneratorNames = DegeneratorName[];
    interface CompileOptions extends RunningScriptOptions {
        sandbox?: Context;
    }
    function compile<R = any, A extends any[] = []>(code: string, returnName: string, names: DegeneratorNames, options?: CompileOptions): (...args: A) => Promise<R>;
}
export = degenerator;
