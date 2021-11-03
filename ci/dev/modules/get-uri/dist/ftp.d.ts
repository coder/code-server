/// <reference types="node" />
import { Options } from 'ftp';
import { Readable } from 'stream';
import { UrlWithStringQuery } from 'url';
import { GetUriOptions } from '.';
interface FTPReadable extends Readable {
    lastModified?: Date;
}
interface FTPOptions extends GetUriOptions, Options {
    cache?: FTPReadable;
    debug?: (s: string) => void;
}
/**
 * Returns a Readable stream from an "ftp:" URI.
 */
export default function get(parsed: UrlWithStringQuery, opts: FTPOptions): Promise<Readable>;
export {};
