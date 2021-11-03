/// <reference types="node" />
import { Writable } from "stream";
export declare type Compressor = (source: string, dest: string) => string;
export declare type Generator = (time: number | Date, index?: number) => string;
export interface Options {
    compress?: boolean | string | Compressor;
    encoding?: BufferEncoding;
    history?: string;
    immutable?: boolean;
    initialRotation?: boolean;
    interval?: string;
    intervalBoundary?: boolean;
    maxFiles?: number;
    maxSize?: string;
    mode?: number;
    path?: string;
    rotate?: number;
    size?: string;
    teeToStdout?: boolean;
}
interface Opts {
    compress?: string | Compressor;
    encoding?: BufferEncoding;
    history?: string;
    immutable?: boolean;
    initialRotation?: boolean;
    interval?: {
        num: number;
        unit: string;
    };
    intervalBoundary?: boolean;
    maxFiles?: number;
    maxSize?: number;
    mode?: number;
    path?: string;
    rotate?: number;
    size?: number;
    teeToStdout?: boolean;
}
declare type Callback = (error?: Error) => void;
interface Chunk {
    chunk: Buffer;
    encoding: BufferEncoding;
}
export declare class RotatingFileStream extends Writable {
    private createGzip;
    private destroyer;
    private error;
    private exec;
    private filename;
    private finished;
    private fsClose;
    private fsCreateReadStream;
    private fsCreateWriteStream;
    private fsMkdir;
    private fsOpen;
    private fsReadFile;
    private fsRename;
    private fsStat;
    private fsUnlink;
    private fsWrite;
    private fsWriteFile;
    private generator;
    private last;
    private maxTimeout;
    private next;
    private opened;
    private options;
    private prev;
    private rotatedName;
    private rotation;
    private size;
    private stream;
    private timer;
    constructor(generator: Generator, options: Opts);
    _destroy(error: Error, callback: Callback): void;
    _final(callback: Callback): void;
    _write(chunk: Buffer, encoding: BufferEncoding, callback: Callback): void;
    _writev(chunks: Chunk[], callback: Callback): void;
    private rewrite;
    private writeToStdOut;
    private init;
    private makePath;
    private reopen;
    private reclose;
    private now;
    private rotate;
    private findName;
    private move;
    private touch;
    private classical;
    private clear;
    private intervalBoundsBig;
    private intervalBounds;
    private interval;
    private compress;
    private external;
    private gzip;
    private rotated;
    private history;
    private historyGather;
    private historyRemove;
    private historyCheckFiles;
    private historyCheckSize;
    private historyWrite;
    private immutate;
}
export declare function createStream(filename: string | Generator, options?: Options): RotatingFileStream;
export {};
