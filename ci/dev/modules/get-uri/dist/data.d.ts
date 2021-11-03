/// <reference types="node" />
import { Readable } from 'stream';
import { UrlWithStringQuery } from 'url';
import { GetUriOptions } from '.';
declare class DataReadable extends Readable {
    hash?: string;
    constructor(hash: string, buf: Buffer);
}
interface DataOptions extends GetUriOptions {
    cache?: DataReadable;
}
/**
 * Returns a Readable stream from a "data:" URI.
 */
export default function get({ href: uri }: UrlWithStringQuery, { cache }: DataOptions): Promise<Readable>;
export {};
