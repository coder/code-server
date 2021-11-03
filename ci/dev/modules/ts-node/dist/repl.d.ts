/// <reference types="node" />
import { Service, CreateOptions } from './index';
export interface ReplService {
    readonly state: EvalState;
    /**
     * Bind this REPL to a ts-node compiler service.  A compiler service must be bound before `eval`-ing code or starting the REPL
     */
    setService(service: Service): void;
    evalCode(code: string): void;
    /**
     * `eval` implementation compatible with node's REPL API
     */
    nodeEval(code: string, _context: any, _filename: string, callback: (err: Error | null, result?: any) => any): void;
    evalAwarePartialHost: EvalAwarePartialHost;
    /** Start a node REPL */
    start(code?: string): void;
}
export interface CreateReplOptions {
    service?: Service;
    state?: EvalState;
    stdin?: NodeJS.ReadableStream;
    stdout?: NodeJS.WritableStream;
    stderr?: NodeJS.WritableStream;
}
/**
 * Create a ts-node REPL instance.
 *
 * Usage example:
 *
 *     const repl = tsNode.createRepl()
 *     const service = tsNode.create({...repl.evalAwarePartialHost})
 *     repl.setService(service)
 *     repl.start()
 */
export declare function createRepl(options?: CreateReplOptions): ReplService;
/**
 * Eval state management. Stores virtual `[eval].ts` file
 */
export declare class EvalState {
    path: string;
    __tsNodeEvalStateBrand: unknown;
    constructor(path: string);
}
/**
 * Filesystem host functions which are aware of the "virtual" [eval].ts file used to compile REPL inputs.
 * Must be passed to `create()` to create a ts-node compiler service which can compile REPL inputs.
 */
export declare type EvalAwarePartialHost = Pick<CreateOptions, 'readFile' | 'fileExists'>;
export declare function createEvalAwarePartialHost(state: EvalState, composeWith?: EvalAwarePartialHost): EvalAwarePartialHost;
