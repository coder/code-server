// Type definitions for tar-fs 2.0
// Project: https://github.com/mafintosh/tar-fs
// Definitions by: Umoxfo <https://github.com/Umoxfo>
//                 Chris Wiggins <https://github.com/chriswiggins>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

// Imported from: https://github.com/soywiz/typescript-node-definitions/d.ts

/// <reference types="node" />

import { ReadStream } from 'fs';
import * as tarStream from 'tar-stream';

export function pack(cwd: string, opts?: PackOptions): tarStream.Pack;
export function extract(cwd: string, opts?: ExtractOptions): tarStream.Extract;

export type Pack = tarStream.Pack;
export type Extract = tarStream.Extract;

export interface Options {
    ignore?: ((name: string) => boolean) | undefined;
    filter?: ((name: string) => boolean) | undefined;
    map?: ((header: Headers) => Headers) | undefined;
    mapStream?: ((fileStream: ReadStream, header: Headers) => ReadStream) | undefined;
    dmode?: number | undefined;
    fmode?: number | undefined;
    readable?: boolean | undefined;
    writable?: boolean | undefined;
    strict?: boolean | undefined;
}

export interface PackOptions extends Options {
    entries?: string[] | undefined;
    dereference?: boolean | undefined;
    finalize?: boolean | undefined;
    finish?: ((pack: tarStream.Pack) => void) | undefined;
    pack?: tarStream.Pack | undefined;
}

export interface ExtractOptions extends Options {
    ignore?: ((name: string, header?: Headers) => boolean) | undefined;
    filter?: ((name: string, header?: Headers) => boolean) | undefined;
    strip?: number | undefined;
}

export interface Headers {
    name: string;
    mode: number;
    mtime: Date;
    size: number;
    type: 'file' | 'directory' | 'link' | 'symlink';
    uid: number;
    gid: number;
}
