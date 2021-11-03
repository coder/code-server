/// <reference types="node" />
import { Readable } from 'stream';
import { UrlWithStringQuery } from 'url';
import { Stats, createReadStream } from 'fs';
import { GetUriOptions } from '.';
declare type ReadStreamOptions = Exclude<Parameters<typeof createReadStream>[1], string>;
interface FileReadable extends Readable {
    stat?: Stats;
}
declare type FileOptions = GetUriOptions & ReadStreamOptions & {
    cache?: FileReadable;
};
/**
 * Returns a `fs.ReadStream` instance from a "file:" URI.
 */
export default function get({ href: uri }: UrlWithStringQuery, opts: FileOptions): Promise<Readable>;
export {};
