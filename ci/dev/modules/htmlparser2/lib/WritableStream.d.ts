/// <reference types="node" />
import { Parser, Handler, ParserOptions } from "./Parser";
import { Writable } from "stream";
import { StringDecoder } from "string_decoder";
/**
 * WritableStream makes the `Parser` interface available as a NodeJS stream.
 *
 * @see Parser
 */
export declare class WritableStream extends Writable {
    _parser: Parser;
    _decoder: StringDecoder;
    constructor(cbs: Partial<Handler>, options?: ParserOptions);
    _write(chunk: string | Buffer, encoding: string, cb: () => void): void;
    _final(cb: () => void): void;
}
//# sourceMappingURL=WritableStream.d.ts.map